import NextAuth, { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import SlackProvider from "next-auth/providers/slack";
import { getDatabase } from "./MongoDB";
import { ObjectId } from "bson";
import { User } from "./Types";
import { GenerateSlug } from "./Utils";
import { Analytics } from "@/lib/client/Analytics";
import Email from "next-auth/providers/email";
import ResendUtils from "./ResendUtils";
import CollectionId from "./client/CollectionId";
import { AdapterUser } from "next-auth/adapters";
import DbInterfaceAuthAdapter from "./DbInterfaceAuthAdapter";
import Logger from "./client/Logger";
import getRollbar from "./client/RollbarUtils";

const logger = new Logger(["AUTH"]);

const cachedDb = getDatabase();
const rollbar = getRollbar();
const adapter = DbInterfaceAuthAdapter(cachedDb, rollbar, logger);

export const AuthenticationOptions: AuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		Google({
			clientId: process.env.GOOGLE_ID,
			clientSecret: process.env.GOOGLE_SECRET,
			allowDangerousEmailAccountLinking: true,
			profile: async (profile) => {
				logger.debug("Google profile:", profile);

				const existingUser = await (
					await cachedDb
				).findObject(CollectionId.Users, { email: profile.email });
				if (existingUser) {
					existingUser.id = profile.sub;
					return existingUser;
				}

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
		SlackProvider({
			clientId: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID as string,
			clientSecret: process.env.SLACK_CLIENT_SECRET as string,
			allowDangerousEmailAccountLinking: true,
			profile: async (profile) => {
				logger.debug("Slack profile:", profile);

				const existing = await (
					await cachedDb
				).findObject(CollectionId.Users, { email: profile.email });

				if (existing) {
					existing.slackId = profile.sub;
					existing.id = profile.sub;
					console.log("Found existing user:", existing);
					return existing;
				}

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
			try {
				const startTime = Date.now();
				logger.debug(`User is signing in: ${user.name}, ${user.email}`);

				Analytics.signIn(user.name ?? "Unknown User");
				const db = await getDatabase();

				let typedUser = user as Partial<User>;

				const existingUser = await db.findObject(CollectionId.Users, {
					email: typedUser.email,
				});

				typedUser._id = existingUser?._id;

				const today = new Date();
				if (
					(typedUser as User).lastSignInDateTime?.toDateString() !==
					today.toDateString()
				) {
					db.updateObjectById(
						CollectionId.Users,
						typedUser._id!,
						{
							lastSignInDateTime: today,
						},
					);
				}

				new ResendUtils().createContact(typedUser as User);

				const endTime = Date.now();
				const elapsedTime = endTime - startTime;

				logger.log(
					"User is signed in:",
					typedUser.name,
					typedUser.email,
					typedUser._id,
					"Elapsed time:",
					elapsedTime + "ms",
				);
			} catch (error) {
				logger.error("Error during sign in:", error);
				rollbar.error("Error during sign in:", error);
			}
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
		signIn: "/signin",
	},
	logger: {
		warn: (code) => {
			logger.warn(code);
			rollbar.warn("Next-Auth: " + code);
		},
		error: (code, metadata) => {
			logger.error(code, metadata);
			rollbar.error("Next-Auth: " + code, metadata);
		},
		debug: (code, metadata) => logger.debug(code, metadata),
	},
};

export default NextAuth(AuthenticationOptions);
