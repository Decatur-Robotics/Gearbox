import { format, MongoDBAdapter } from "@next-auth/mongodb-adapter";
import {
	Adapter,
	AdapterAccount,
	AdapterSession,
	AdapterUser,
	VerificationToken,
} from "next-auth/adapters";
import DbInterface from "./client/dbinterfaces/DbInterface";
import CollectionId from "./client/CollectionId";
import { User, Session } from "./Types";
import { GenerateSlug } from "./Utils";
import { ObjectId } from "bson";
import Logger from "./client/Logger";
import { RollbarInterface } from "./client/RollbarUtils";

/**
 * @tested_by tests/lib/DbInterfaceAuthAdapter.test.ts
 */
export default function DbInterfaceAuthAdapter(
	dbPromise: Promise<DbInterface>,
	rollbar: RollbarInterface,
	baseLogger?: Logger,
): Adapter {
	const logger =
		(baseLogger && baseLogger.extend(["ADAPTER"])) ??
		new Logger(["AUTH"], false);

	const adapter: Adapter = {
		createUser: async (data: Record<string, unknown>) => {
			const db = await dbPromise;

			const adapterUser = format.to<AdapterUser>(data);

			logger.debug("Creating user:", adapterUser.name);

			// Check if user already exists
			const existingUser = await db.findObject(CollectionId.Users, {
				email: adapterUser.email,
			});

			if (existingUser) {
				// If user exists, return existing user
				logger.warn("User already exists:", existingUser.name);
				rollbar.warn("User already exists when creating user", {
					existingUser,
					data,
				});
				return format.from<AdapterUser>(existingUser);
			}

			logger.debug("Creating user:", adapterUser);

			const user = new User(
				adapterUser.name ?? "Unknown",
				adapterUser.email,
				adapterUser.image ?? process.env.DEFAULT_IMAGE,
				false,
				await GenerateSlug(
					db,
					CollectionId.Users,
					adapterUser.name ?? "Unknown",
				),
				[],
				[],
				adapterUser.id,
				0,
				1,
			);

			user._id = new ObjectId(adapterUser._id) as any;

			const dbUser = await db.addObject(CollectionId.Users, user);
			logger.info("Created user:", dbUser._id!.toString());
			return format.from<AdapterUser>(dbUser);
		},
		getUser: async (id: string) => {
			const db = await dbPromise;

			if (id.length !== 24) return null;

			logger.debug("Getting user:", id);

			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(id),
			);

			if (!user) {
				logger.error("User not found:", id);
				rollbar.error("User not found when getting user", {
					id,
				});
				throw new Error("User not found");
			}
			user.id = user._id!.toString()!;
			return format.from<AdapterUser>(user);
		},
		getUserByEmail: async (email: string) => {
			const db = await dbPromise;

			logger.debug("Getting user by email:", email);

			const user = await db.findObject(CollectionId.Users, { email });

			if (!user) {
				logger.error("User not found by email:", email);
				rollbar.error("User not found when getting user by email", {
					email,
				});
				throw new Error("User not found");
			}

			user.id = user._id!.toString()!;
			return format.from<AdapterUser>(user);
		},
		getUserByAccount: async (
			providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">,
		) => {
			const db = await dbPromise;

			logger.debug("Getting user by account:", providerAccountId);

			const account = await db.findObject(CollectionId.Accounts, {
				providerAccountId: providerAccountId.providerAccountId,
			});

			if (!account) {
				logger.error(
					"Account not found by providerAccountId:",
					providerAccountId.providerAccountId,
				);
				rollbar.error("Account not found when getting user by account", {
					providerAccountId,
				});
				throw new Error("Account not found");
			}

			const user = await db.findObjectById(
				CollectionId.Users,
				account.userId as any as ObjectId,
			);

			if (!user) {
				logger.error("User not found:", account.userId);
				rollbar.error("User not found when getting user by account", {
					providerAccountId,
				});
				throw new Error("User not found");
			}

			logger.debug(
				"Found user by account: Account",
				providerAccountId.providerAccountId,
				"=> User",
				user._id,
				user.name,
			);

			user.id = user._id!.toString()!;
			return format.from<AdapterUser>(user);
		},
		updateUser: async (
			data: Partial<AdapterUser> & Pick<AdapterUser, "id">,
		) => {
			const db = await dbPromise;
			const { _id, ...user } = format.to<AdapterUser>(data);

			if (!_id) {
				logger.error("User ID not found when updating user:", user);
				rollbar.error("User ID not found when updating user", {
					user,
				});
				throw new Error("User ID not found");
			}

			logger.debug("Updating user:", _id);

			const existing = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(_id),
			);

			if (!existing) {
				logger.error("User not found:", _id);
				rollbar.error("User not found when updating user", {
					_id,
					user,
				});
				throw new Error("User not found");
			}

			user.id = existing._id!.toString()!;

			await db.updateObjectById(
				CollectionId.Users,
				new ObjectId(_id),
				user as Partial<User>,
			);

			return format.from<AdapterUser>({ ...existing, ...user, _id: _id });
		},
		deleteUser: async (id: string) => {
			const db = await dbPromise;

			logger.log("Deleting user:", id);

			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(id),
			);
			if (!user) {
				logger.error("User not found:", id);
				rollbar.error("User not found when deleting user", {
					id,
				});
				throw new Error("User not found");
			}

			const account = await db.findObject(CollectionId.Accounts, {
				userId: user._id,
			});

			const sessions = await db.findObjects(CollectionId.Sessions, {
				userId: user._id,
			});

			const promises: Promise<any>[] = [
				db.deleteObjectById(CollectionId.Users, user._id as any as ObjectId),
			];

			if (account) {
				promises.push(
					db.deleteObjectById(CollectionId.Accounts, new ObjectId(account._id)),
				);
			}

			if (sessions.length) {
				promises.push(
					Promise.all(
						sessions.map((session) =>
							db.deleteObjectById(
								CollectionId.Sessions,
								new ObjectId(session._id),
							),
						),
					),
				);
			}

			await Promise.all(promises);

			return format.from<AdapterUser>(user);
		},
		/**
		 * Creates an account
		 */
		linkAccount: async (data: Record<string, unknown>) => {
			const db = await dbPromise;

			const account = format.to<AdapterAccount>(data);
			account.userId = data["userId"] as any; // userId gets overwritten for some reason

			logger.debug(
				"Linking account: providerAccountId",
				account.providerAccountId,
				"userId:",
				account.userId,
			);

			const existingAccount = await db.findObject(CollectionId.Accounts, {
				providerAccountId: account.providerAccountId,
			});

			if (existingAccount) {
				logger.warn(
					"Account already exists:",
					existingAccount.providerAccountId,
				);
				rollbar.warn("Account already exists when linking account", {
					account,
				});
				return format.from<AdapterAccount>(existingAccount);
			}

			await db.addObject(CollectionId.Accounts, account);

			return account;
		},
		unlinkAccount: async (
			providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">,
		) => {
			const db = await dbPromise;

			logger.debug("Unlinking account:", providerAccountId.providerAccountId);

			const account = await db.findObject(CollectionId.Accounts, {
				providerAccountId: providerAccountId.providerAccountId,
			});

			if (!account) {
				logger.error(
					"Account not found by providerAccountId:",
					providerAccountId.providerAccountId,
				);
				rollbar.error("Account not found when unlinking account", {
					providerAccountId,
				});
				throw new Error("Account not found");
			}

			await db.deleteObjectById(
				CollectionId.Accounts,
				new ObjectId(account._id),
			);

			return format.from<AdapterAccount>(account);
		},
		getSessionAndUser: async (sessionToken: string) => {
			const db = await dbPromise;

			const session = await db.findObject(CollectionId.Sessions, {
				sessionToken,
			});

			if (!session) {
				logger.error("Session not found:", sessionToken);
				rollbar.error("Session not found when getting session and user", {
					sessionToken,
				});
				throw new Error("Session not found");
			}

			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(session.userId),
			);

			if (!user) {
				logger.error("User not found:", session.userId);
				rollbar.error("User not found when getting session and user", {
					sessionToken,
				});
				throw new Error("User not found");
			}

			logger.debug(
				"Got session and user. Session Token:",
				sessionToken,
				"User:",
				user._id,
				user.name,
			);

			return {
				session: format.from<AdapterSession>(session),
				user: {
					...format.from<AdapterUser>(user),
					_id: user._id,
				},
			};
		},
		createSession: async (data: Record<string, unknown>) => {
			const db = await dbPromise;
			const session = format.to<AdapterSession>(data);

			if (!session.userId) {
				logger.error("User ID not found in session:", session);
				rollbar.error("User ID not found in session when creating session", {
					session,
				});
				throw new Error("User ID not found in session.");
			}

			logger.debug(
				"Creating session:",
				session._id,
				"with user",
				session.userId,
			);

			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(session.userId),
			);

			if (!user) {
				logger.error("User not found:", session.userId);
				rollbar.error("User not found", {
					session,
				});
				throw new Error("User not found");
			}

			if (!user) {
				logger.error(
					"Session has invalid user. ID:",
					session.userId,
					"Session:",
					session,
				);
				rollbar.error("Session has invalid user when creating session", {
					session,
				});
				throw new Error("Session has invalid user.");
			}

			session.userId = user._id as any;

			const dbSession = await db.addObject(
				CollectionId.Sessions,
				session as unknown as Session,
			);

			return format.from<AdapterSession>(dbSession);
		},
		updateSession: async (
			data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
		) => {
			const db = await dbPromise;
			const { _id, ...session } = format.to<AdapterSession>(data);

			logger.debug("Updating session:", session.sessionToken);

			const existing = await db.findObject(CollectionId.Sessions, {
				sessionToken: session.sessionToken,
			});

			if (!existing) {
				logger.error("Session not found:", session.sessionToken);
				rollbar.error("Session not found when updating session", {
					session,
				});
				throw new Error("Session not found");
			}

			if (session.userId) {
				session.userId = new ObjectId(session.userId) as any;
			}

			await db.updateObjectById(
				CollectionId.Sessions,
				new ObjectId(existing._id),
				session as unknown as Partial<Session>,
			);

			return format.from<AdapterSession>({ ...existing, ...data });
		},
		deleteSession: async (sessionToken: string) => {
			const db = await dbPromise;

			logger.debug("Deleting session:", sessionToken);

			const session = await db.findObject(CollectionId.Sessions, {
				sessionToken,
			});

			if (!session) {
				logger.error("Session not found:", sessionToken);
				rollbar.error("Session not found when deleting session", {
					sessionToken,
				});
				throw new Error("Session not found");
			}

			await db.deleteObjectById(
				CollectionId.Sessions,
				new ObjectId(session._id),
			);

			return format.from<AdapterSession>(session);
		},
		createVerificationToken: async (token: VerificationToken) => {
			const db = await dbPromise;

			logger.debug("Creating verification token:", token.identifier);

			await db.addObject(
				CollectionId.VerificationTokens,
				format.to(token) as VerificationToken,
			);
			return token;
		},
		useVerificationToken: async (token: {
			identifier: string;
			token: string;
		}) => {
			const db = await dbPromise;

			logger.info("Using verification token:", token.identifier);

			const existing = await db.findObject(CollectionId.VerificationTokens, {
				token: token.token,
			});

			if (!existing) {
				logger.error("Verification token not found:", token.token);
				rollbar.error("Verification token not found when using token", {
					token,
				});
				throw new Error("Verification token not found");
			}

			await db.deleteObjectById(
				CollectionId.VerificationTokens,
				new ObjectId(existing._id),
			);

			return format.from<VerificationToken>(existing);
		},
	};

	return adapter;
}
