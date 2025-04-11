import { _id, format, MongoDBAdapter } from "@next-auth/mongodb-adapter";
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
import { Profile } from "next-auth";

function formatTo<T extends object>(obj: T | undefined) {
	if (!obj) return undefined;

	const formatted = format.to<T>(obj);

	if ("_id" in obj) {
		formatted._id = obj._id as ObjectId;
	}

	if ("id" in obj) {
		(formatted as any).id = obj.id;
	}

	if ("userId" in obj) {
		(formatted as any).userId = new ObjectId((obj.userId as any).toString());
	}

	return formatted;
}

function formatFrom<T extends object>(obj: T | undefined) {
	console.log("formatFrom", obj);
	if (!obj) return undefined;

	const formatted = format.from<T>(obj);
	if ("_id" in obj) {
		(formatted as any)._id = obj._id as ObjectId;
	}
	if ("id" in obj) {
		(formatted as any).id = obj.id;
	}

	if ("userId" in obj) {
		(formatted as any).userId = obj.userId;
	}

	return formatted;
}

/**
 * Should match the MongoDB adapter as closely as possible
 * (https://github.com/nextauthjs/next-auth/blob/main/packages/adapter-mongodb/src/index.ts).
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
		/**
		 * @param data returns from the profile callback of the auth provider
		 */
		createUser: async (data: Record<string, unknown>) => {
			const profile = formatTo<Profile>(data)!;

			const user = new User(
				profile.name ?? profile.email ?? "Unknown User",
				profile.email,
				profile.image,
				false,
				await GenerateSlug(
					await dbPromise,
					CollectionId.Users,
					profile.name ?? profile.email ?? "Unknown User",
				),
				[],
				[],
				profile.sub,
				10,
				1,
			);

			user._id = new ObjectId() as any;

			// We need the 'id' field to avoid the error "Profile id is missing in OAuth profile response"
			user.id = user._id!.toString();

			await (await dbPromise).addObject(CollectionId.Users, user);
			return formatFrom(user);
		},
		getUser: async (id: string) => {
			const user = await (
				await dbPromise
			).findObjectById(CollectionId.Users, _id(id));
			if (!user) return null;
			return formatFrom(user) as AdapterUser;
		},
		getUserByEmail: async (email: string) => {
			const user = await (
				await dbPromise
			).findObject(CollectionId.Users, {
				email,
			});
			if (!user) return null;
			return formatFrom(user) as AdapterUser;
		},
		getUserByAccount: async (
			providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">,
		) => {
			const db = await dbPromise;
			const account = await db.findObject(
				CollectionId.Accounts,
				providerAccountId,
			);
			if (!account) return null;
			const user = await db.findObjectById(
				CollectionId.Users,
				new ObjectId(account.userId),
			);
			if (!user) return null;
			return formatFrom(user) as AdapterUser;
		},
		updateUser: async (
			data: Partial<AdapterUser> & Pick<AdapterUser, "id">,
		) => {
			const { _id, ...user } = formatTo<AdapterUser>(data as any)!;
			const db = await dbPromise;

			const result = await db.findObjectAndUpdate(
				CollectionId.Users,
				_id,
				user as unknown as Partial<User>,
			);

			return formatFrom(result!) as AdapterUser;
		},
		deleteUser: async (id: string) => {
			const userId = _id(id);
			const db = await dbPromise;
			await Promise.all([
				db.deleteObjects(CollectionId.Accounts, { userId: userId as any }),
				db.deleteObjects(CollectionId.Sessions, { userId: userId as any }),
				db.deleteObjectById(CollectionId.Users, userId),
			]);
		},
		/**
		 * Creates an account
		 */
		linkAccount: async (data: Record<string, unknown>) => {
			const account = formatTo<AdapterAccount>(data as any)!;
			await (await dbPromise).addObject(CollectionId.Accounts, account);
			return account;
		},
		/**
		 * Deletes an account, but not the user
		 */
		unlinkAccount: async (
			providerAccountId: Pick<AdapterAccount, "provider" | "providerAccountId">,
		) => {
			const account = await (
				await dbPromise
			).findObjectAndDelete(CollectionId.Accounts, providerAccountId);
			return formatFrom(account!) ?? null;
		},
		getSessionAndUser: async (sessionToken: string) => {
			const db = await dbPromise;
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
				user: formatFrom(user) as any as AdapterUser,
				session: formatFrom(session) as any as AdapterSession,
			};
		},
		createSession: async (data: Record<string, unknown>) => {
			const session = formatTo<AdapterSession>(data as any)!;
			await (await dbPromise).addObject(CollectionId.Sessions, session as any);
			return formatFrom(session)!;
		},
		updateSession: async (
			data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">,
		) => {
			const { _id, ...session } = formatTo<AdapterSession>(data as any)!;

			const db = await dbPromise;
			const existing = await db.findObject(CollectionId.Sessions, {
				sessionToken: session.sessionToken,
			});

			await db.updateObjectById(
				CollectionId.Sessions,
				existing?._id as any,
				session as any,
			);
			return formatFrom({
				_id,
				...existing,
				...session,
			}) as any as AdapterSession;
		},
		deleteSession: async (sessionToken: string) => {
			const session = await (
				await dbPromise
			).findObjectAndDelete(CollectionId.Sessions, {
				sessionToken,
			});
			return formatFrom(session!) as any as AdapterSession;
		},
		createVerificationToken: async (token: VerificationToken) => {
			await (
				await dbPromise
			).addObject(CollectionId.VerificationTokens, format.to(token) as any);
			return token;
		},
		useVerificationToken: async (token: {
			identifier: string;
			token: string;
		}) => {
			const verificationToken = await (
				await dbPromise
			).findObjectAndDelete(CollectionId.VerificationTokens, token);
			if (!verificationToken) return null;
			const { _id, ...rest } = verificationToken;
			return rest;
		},
	};

	return adapter;
}
