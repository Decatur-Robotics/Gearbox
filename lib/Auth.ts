import NextAuth, { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import SlackProvider from "next-auth/providers/slack";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { getDatabase, clientPromise } from "./MongoDB";
import { ObjectId } from "bson";
import { User } from "./Types";
import { GenerateSlug } from "./Utils";
import { Analytics } from '@/lib/client/Analytics';
import Email from "next-auth/providers/email";
import ResendUtils from "./ResendUtils";
import CollectionId from "./client/CollectionId";

var db = getDatabase();

const adapter = MongoDBAdapter(clientPromise, { databaseName: process.env.DB });

export const AuthenticationOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      profile: async (profile) => {
        const user = new User(
          profile.name,
          profile.email,
          profile.picture,
          false,
          await GenerateSlug(await getDatabase(), CollectionId.Users, profile.name),
          [],
          []
        );
        user.id = profile.sub;
        return user;
      },
    }),
    /*
        GitHubProvider({
          clientId: process.env.GITHUB_ID as string,
          clientSecret: process.env.GITHUB_SECRET as string,
          profile: async (profile) => {
            const user = new User(profile.login, profile.email, profile.avatar_url, false, await GenerateSlug(CollectionId.Users, profile.login), [], []);
            user.id = profile.id;
            return user;
        },
      }),
      */
    SlackProvider({
      clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID as string,
      clientSecret: process.env.SLACK_CLIENT_SECRET as string,
      profile: async (profile) => {
        const user = new User(
          profile.name,
          profile.email,
          profile.picture,
          false,
          await GenerateSlug(await getDatabase(), CollectionId.Users, profile.name),
          [],
          [],
          profile.sub,
          10,
          1
        );
        user.id = profile.sub;
        return user;
      }
    }),
    Email({
      server: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.SMTP_FROM
    })
  ],
  callbacks: {
    async session({ session, user }) {
      session.user = await (await db).findObjectById(
        CollectionId.Users,
        new ObjectId(user.id)
      );
      return session;
    },

    async redirect({ baseUrl }) {
      return baseUrl + "/onboarding";
    },

    async signIn({ user }) {
      Analytics.signIn(user.name ?? "Unknown User");
      new ResendUtils().createContact(user);

      let typedUser = user as Partial<User>;
      if (!typedUser.slug) {
        console.log("User is incomplete, filling in missing fields");
        
        // User is incomplete, fill in the missing fields
        typedUser = {
          name: typedUser.name ?? typedUser.email?.split("@")[0],
          image: typedUser.image ?? "https://4026.org/user.jpg",
          slug: await GenerateSlug(await getDatabase(), CollectionId.Users, typedUser.name!),
          teams: typedUser.teams ?? [],
          owner: typedUser.owner ?? [],
          slackId: typedUser.slackId ?? "",
          onboardingComplete: typedUser.onboardingComplete ?? false,
          admin: typedUser.admin ?? false,
          xp: typedUser.xp ?? 0,
          level: typedUser.level ?? 0,
          ...typedUser,
        } as User;

        await (await db).updateObjectById(CollectionId.Users, new ObjectId(typedUser._id?.toString()), typedUser);
      }

      return true;
    }
  },
  debug: false,
  adapter: {
    ...adapter,
    createUser: async (user) => {
      const createdUser = await adapter.createUser!(user);

      Analytics.newSignUp(user.name ?? "Unknown User");

      return createdUser;
    }
  },
  pages: {
    //signIn: "/signin",
  },
};

export default NextAuth(AuthenticationOptions);
