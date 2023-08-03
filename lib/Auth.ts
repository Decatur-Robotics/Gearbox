import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import { Collections, GetDatabase, clientPromise } from './MongoDB'
import { ObjectId } from 'mongodb'
import { User } from './Types';
import { GenerateSlug } from './Utils'

var db = GetDatabase();

export default NextAuth({
    providers: [
      Google({
        clientId: process.env.GOOGLE_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        profile: async (profile, tokens) => {
            return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                admin: false,
                slug: await GenerateSlug(Collections.Users, profile.name),
                teams: [],
                owner: [],
            }
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
  