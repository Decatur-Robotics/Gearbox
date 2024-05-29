import NextAuth, { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import SlackProvider from "next-auth/providers/slack";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { Collections, GetDatabase, clientPromise } from "./MongoDB";
import { Admin, ObjectId } from "mongodb";
import { User } from "./Types";
import { GenerateSlug } from "./Utils";

var db = GetDatabase();

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
          await GenerateSlug(Collections.Users, profile.name),
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
            const user = new User(profile.login, profile.email, profile.avatar_url, false, await GenerateSlug(Collections.Users, profile.login), [], []);
            user.id = profile.id;
            return user;
        },
      }),
      */
    SlackProvider({
      clientId: process.env.SLACK_CLIENT_ID as string,
      clientSecret: process.env.SLACK_CLIENT_SECRET as string,
      profile: async (profile) => {
        const user = new User(
          profile.name,
          profile.email,
          profile.picture,
          false,
          await GenerateSlug(Collections.Users, profile.name),
          [],
          [],
          profile.sub,
          10,
          1
        );
        user.id = profile.sub;
        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user = await (await db).findObjectById(
        Collections.Users,
        new ObjectId(user.id)
      );
      return session;
    },

    async redirect({ url, baseUrl }) {
      return baseUrl + "/onboarding";
    },
  },
  debug: false,
  adapter: MongoDBAdapter(clientPromise, { databaseName: process.env.DB }),
  pages: {
    //signIn: "/signin",
  },
};

export default NextAuth(AuthenticationOptions);
