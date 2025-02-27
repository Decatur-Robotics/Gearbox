import NextAuth, { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import SlackProvider from "next-auth/providers/slack";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { getDatabase, clientPromise } from "./MongoDB";
import { ObjectId } from "bson";
import { User } from "./Types";
import { GenerateSlug, repairUser } from "./Utils";
import { Analytics } from "@/lib/client/Analytics";
import Email from "next-auth/providers/email";
import ResendUtils from "./ResendUtils";
import CollectionId from "./client/CollectionId";
import { AdapterUser } from "next-auth/adapters";
import { wait } from "./client/ClientUtils";
import DbInterfaceAuthAdapter from "./DbInterfaceAuthAdapter";

const cachedDb = getDatabase();
const adapter = DbInterfaceAuthAdapter(cachedDb);
// const adapter = MongoDBAdapter(clientPromise, {
// 	databaseName: process.env.DB,
// });

export const AuthenticationOptions: AuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		Google({
			clientId: process.env.GOOGLE_ID,
			clientSecret: process.env.GOOGLE_SECRET,
			allowDangerousEmailAccountLinking: true,
			profile: async (profile) => {
				const user = new User(
					profile.name,
					profile.email,
					profile.picture,
					false,
					await GenerateSlug(await cachedDb, CollectionId.Users, profile.name),
					[],
					[],
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
			allowDangerousEmailAccountLinking: true,
			profile: async (profile) => {
				const user = new User(
					profile.name,
					profile.email,
					profile.picture,
					false,
					await GenerateSlug(await cachedDb, CollectionId.Users, profile.name),
					[],
					[],
					profile.sub,
					10,
					1,
				);
				user.id = profile.sub;
				return user;
			},
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
			from: process.env.SMTP_FROM,
		}),
	],
	callbacks: {
		async session({ session, user }) {
			session.user = user;

			return session;
		},

		async redirect({ baseUrl }) {
			return baseUrl + "/onboarding";
		},

		/**
		 * For email sign in, runs when the "Sign In" button is clicked (before email is sent).
		 */
		async signIn({ user }) {
			const startTime = Date.now();
			console.log(
				`User is signing in: ${user.name}, ${user.email}, ${user.id}`,
			);

			Analytics.signIn(user.name ?? "Unknown User");
			const db = await getDatabase(false);

			let typedUser = user as Partial<User>;
			// if (!typedUser.slug || typedUser._id?.toString() != typedUser.id) {
			// 	const repairUserOnceItIsInDb = async () => {
			// 		console.log(
			// 			"User is incomplete, waiting for it to be in the database.",
			// 		);
			// 		let foundUser: User | undefined = undefined;
			// 		while (!foundUser) {
			// 			foundUser = await db.findObject(CollectionId.Users, {
			// 				email: typedUser.email,
			// 			});

			// 			if (!foundUser) await wait(50);
			// 		}

			// 		console.log("User is incomplete, filling in missing fields.");

			// 		typedUser._id = foundUser._id;
			// 		typedUser.lastSignInDateTime = new Date();

			// 		typedUser = await repairUser(db, typedUser);

			// 		console.log("User updated:", typedUser._id?.toString());
			// 	};

			// 	repairUserOnceItIsInDb();
			// }

			const today = new Date();
			if (
				(typedUser as User).lastSignInDateTime?.toDateString() !==
				today.toDateString()
			) {
				// We use user.id since user._id strangely doesn't exist on user.
				db.updateObjectById(
					CollectionId.Users,
					new ObjectId(typedUser._id?.toString()),
					{
						lastSignInDateTime: today,
					},
				);
			}

			new ResendUtils().createContact(typedUser as User);

			const endTime = Date.now();
			const elapsedTime = endTime - startTime;

			console.log(
				"User is signed in:",
				typedUser.name,
				typedUser.email,
				typedUser._id?.toString(),
				"Elapsed time:",
				elapsedTime + "ms",
			);
			return true;
		},
	},
	debug: false,
	adapter: {
		...adapter,
		createUser: async (user: Omit<AdapterUser, "id">) => {
			const createdUser = await adapter.createUser!(user);

			Analytics.newSignUp(user.name ?? "Unknown User");

			return createdUser;
		},
	},
	pages: {
		//signIn: "/signin",
	},
};

export default NextAuth(AuthenticationOptions);
