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
					await GenerateSlug(
						await getDatabase(),
						CollectionId.Users,
						profile.name,
					),
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
			profile: async (profile) => {
				const user = new User(
					profile.name,
					profile.email,
					profile.picture,
					false,
					await GenerateSlug(
						await getDatabase(),
						CollectionId.Users,
						profile.name,
					),
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
			session.user = await (
				await db
			).findObjectById(CollectionId.Users, new ObjectId(user.id));

			return session;
		},

		async redirect({ baseUrl }) {
			return baseUrl + "/onboarding";
		},

		async signIn({ user }) {
			Analytics.signIn(user.name ?? "Unknown User");

			let typedUser = user as Partial<User>;
			if (!typedUser.slug) {
				console.log(
					"User is incomplete, filling in missing fields. User:",
					typedUser,
				);

				typedUser = await repairUser(await getDatabase(), typedUser);

				// With email sign up, the user is not in the DB yet. I don't know why and it enrages me.
				// So, we update the user after a delay.
				// I hate this on so many levels, but it's eaten up my entire Friday night and my body yearns for sleep.
				// I'm sorry. Heaven forgive me.
				// - Renato, 1/31/2025, 11:22 PM
				new Promise<void>(async (resolve) => {
					setTimeout(async () => {
						console.log("Post-Updating user... If you're readining this, it comes from Auth.ts. Go fix it.");
						console.log("Id:", typedUser._id);

						let foundUser = await (
							await db
						).findObjectById(
							CollectionId.Users,
							typedUser._id as unknown as ObjectId,
						);
						console.log("Found user:", foundUser);

						if (!foundUser) {
							foundUser = await (
								await db
							).findObject(CollectionId.Users, { email: typedUser.email });
							console.log("Found user by email:", foundUser);
						}

						delete typedUser._id;

						await (
							await db
						).updateObjectById(
							CollectionId.Users,
							foundUser._id as unknown as ObjectId,
							typedUser as User,
						);
						resolve();
					}, 1000);
				});

				console.log("User updated:", typedUser);
			}

			new ResendUtils().createContact(typedUser as User);

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
