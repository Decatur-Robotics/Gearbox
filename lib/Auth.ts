import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { Collections, GetDatabase, clientPromise } from './MongoDB'
import { Admin, ObjectId } from 'mongodb'
import { User } from './Types';
import { GenerateSlug } from './Utils'

var db = GetDatabase();

export default NextAuth({
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
      Google({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        profile: async (profile, tokens) => {
            const user = new User(profile.name, profile.email, profile.picture, false, await GenerateSlug(Collections.Users, profile.name), [], []);
            user.id = profile.sub;
            return user;
        },
      }),
      GitHubProvider({
        clientId: process.env.GITHUB_ID as string,
        clientSecret: process.env.GITHUB_SECRET as string,
        profile: async (profile, tokens) => {
          const user = new User(profile.name, profile.email, profile.picture, false, await GenerateSlug(Collections.Users, profile.name), [], []);
          user.id = profile.sub;
          return user;
      },
      }),
    ],
    callbacks: {
      async session({ session, user, token }) {
        session.user = await (await db).findObjectById(Collections.Users, new ObjectId(user.id));
        return session;
      }
    },
    debug: false,
    adapter: MongoDBAdapter(clientPromise, {databaseName: process.env.DB}),
});
  