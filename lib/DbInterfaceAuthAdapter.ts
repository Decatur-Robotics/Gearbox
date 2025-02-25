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

export default function DbInterfaceAuthAdapter(
	dbPromise: Promise<DbInterface>,
): Adapter {
	const adapter: Adapter = {
		createUser: async (data: Record<string, unknown>) => {
			const db = await dbPromise;

			const adapterUser = format.to<AdapterUser>(data);

			console.log("[AUTH] Creating user:", adapterUser.name);

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
				undefined,
				0,
				1,
			);

			user._id = new ObjectId(adapterUser._id) as any;

			await db.addObject(CollectionId.Users, user);
			return format.from<AdapterUser>(adapterUser);
		},
		getUser: async (id: string) => {
			const db = await dbPromise;

			if (id.length !== 24) return null;

			console.log("[AUTH] Getting user:", id);

			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(id),
			);

			if (!user) return null;
			return format.from<AdapterUser>(user);
		},
		getUserByEmail: async (email: string) => {
			const db = await dbPromise;

			console.log("[AUTH] Getting user by email:", email);

			const account = await db.findObject(CollectionId.Users, { email });

			if (!account) return null;
			return format.from<AdapterUser>(account);
		},
		getUserByAccount: async (
			providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">,
		) => {
			const db = await dbPromise;

			console.log(
				"Getting user by account:",
				providerAccountId.providerAccountId,
			);

			const account = await db.findObject(CollectionId.Accounts, {
				providerAccountId: providerAccountId.providerAccountId,
			});

			if (!account) return null;

			const user = await db.findObjectById(
				CollectionId.Users,
				account.userId as any as ObjectId,
			);

			if (!user) return null;
			return format.from<AdapterUser>(user);
		},
		updateUser: async (
			data: Partial<AdapterUser> & Pick<AdapterUser, "id">,
		) => {
			const db = await dbPromise;
			const { _id, ...user } = format.to<AdapterUser>(data);

			console.log("[AUTH] Updating user:", _id);

			const existing = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(_id),
			);

			const result = await db.updateObjectById(
				CollectionId.Users,
				new ObjectId(_id),
				user as Partial<User>,
			);

			return format.from<AdapterUser>({ ...existing, ...user, _id: _id });
		},
		deleteUser: async (id: string) => {
			const db = await dbPromise;

			console.log("[AUTH] Deleting user:", id);

			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(id),
			);
			if (!user) return null;

			const account = await db.findObject(CollectionId.Accounts, {
				userId: user._id,
			});

			const session = await db.findObject(CollectionId.Sessions, {
				userId: user._id,
			});

			const promises = [
				db.deleteObjectById(CollectionId.Users, new ObjectId(id)),
			];

			if (account) {
				promises.push(
					db.deleteObjectById(CollectionId.Accounts, new ObjectId(account._id)),
				);
			}

			if (session) {
				promises.push(
					db.deleteObjectById(CollectionId.Sessions, new ObjectId(session._id)),
				);
			}

			await Promise.all(promises);

			return format.from<AdapterUser>(user);
		},
		linkAccount: async (data: Record<string, unknown>) => {
			const db = await dbPromise;
			const account = format.to<AdapterAccount>(data);

			console.log(
				"Linking account:",
				account.providerAccountId,
				"User:",
				account.userId,
			);

			await db.addObject(CollectionId.Accounts, account);

			return account;
		},
		unlinkAccount: async (
			providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">,
		) => {
			const db = await dbPromise;

			console.log("[AUTH] Unlinking account:", providerAccountId.providerAccountId);

			const account = await db.findObject(CollectionId.Accounts, {
				providerAccountId: providerAccountId.providerAccountId,
			});

			if (!account) return null;

			await db.deleteObjectById(
				CollectionId.Accounts,
				new ObjectId(account._id),
			);

			return format.from<AdapterAccount>(account);
		},
		getSessionAndUser: async (sessionToken: string) => {
			const db = await dbPromise;

			console.log("[AUTH] Getting session and user:", sessionToken);

			const session = await db.findObject(CollectionId.Sessions, {
				sessionToken,
			});

			if (!session) return null;

			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(session.userId),
			);

			if (!user) return null;
			return {
				session: format.from<AdapterSession>(session),
				user: format.from<AdapterUser>(user),
			};
		},
		createSession: async (data: Record<string, unknown>) => {
			const db = await dbPromise;

			const session = format.to<AdapterSession>(data);

			console.log("[AUTH] Creating session:", session.sessionToken);

			session.userId = new ObjectId(session.userId) as any;

			await db.addObject(CollectionId.Sessions, session as unknown as Session);

			return format.from<AdapterSession>(session);
		},
		updateSession: async (
			data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
		) => {
			const db = await dbPromise;
			const { _id, ...session } = format.to<AdapterSession>(data);

			console.log("[AUTH] Updating session:", session.sessionToken);

			const existing = await db.findObject(CollectionId.Sessions, {
				sessionToken: session.sessionToken,
			});

			if (!existing) return null;

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

			console.log("[AUTH] Deleting session:", sessionToken);

			const session = await db.findObject(CollectionId.Sessions, {
				sessionToken,
			});

			if (!session) return null;

			await db.deleteObjectById(
				CollectionId.Sessions,
				new ObjectId(session._id),
			);

			return format.from<AdapterSession>(session);
		},
		createVerificationToken: async (token: VerificationToken) => {
			const db = await dbPromise;

			console.log("[AUTH] Creating verification token:", token.identifier);

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

			console.log("[AUTH] Using verification token:", token.identifier);

			const existing = await db.findObject(CollectionId.VerificationTokens, {
				token: token.token,
			});

			if (!existing) return null;

			await db.deleteObjectById(
				CollectionId.VerificationTokens,
				new ObjectId(existing._id),
			);

			return format.from<VerificationToken>(existing);
		},
	};

	return adapter;
}
