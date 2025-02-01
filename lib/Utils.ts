/**
 * Utility Functions
 * @remarks
 * This is a general collection of commonly used functions
 *
 * @tested_by tests/lib/Utils.test.ts
 */
import { removeWhitespaceAndMakeLowerCase } from "./client/ClientUtils";
import CollectionId from "./client/CollectionId";
import DbInterface from "./client/dbinterfaces/DbInterface";
import { Redirect } from "next";
import { User } from "./Types";
import { ObjectId } from "bson";

/**
 * Generates a SLUG from a supplied name- ensures it is unique
 *
 * @remarks
 * SLUG stands for Short URL, and is a human readable ID system we use
 * This function generally is ran when an object is added to the database
 *
 * @param collection - A Database Collection
 * @param name - The name that is the base of the generation
 * @returns - A Unique SLUG
 */
export async function GenerateSlug(
	db: DbInterface,
	collection: CollectionId,
	name: string,
): Promise<string> {
	return GenerateSlugWithIndex(db, collection, name, 0);
}

/**
 * @param index will not be appended if 0 is passed as the index
 */
async function GenerateSlugWithIndex(
	db: DbInterface,
	collection: CollectionId,
	name: string,
	index: number,
): Promise<string> {
	let finalName;
	if (index === 0) {
		finalName = removeWhitespaceAndMakeLowerCase(name);
	} else {
		finalName = name + index.toString();
	}

	const result = await db.findObject(collection, { slug: finalName });
	if (result) {
		return GenerateSlugWithIndex(
			db,
			collection,
			index === 0 ? finalName : name,
			index + 1,
		);
	}

	return finalName;
}

export function createRedirect(
	destination: string,
	query: Record<string, any> = {},
): { redirect: Redirect } {
	return {
		redirect: {
			destination: `${destination}${Object.keys(query).length ? "?" : ""}${Object.keys(
				query,
			)
				.map(
					(key) =>
						`${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`,
				)
				.join("&")}`,
			permanent: false,
		},
	};
}

export function isDeveloper(email: string | undefined) {
	return (JSON.parse(process.env.DEVELOPER_EMAILS) as string[]).includes(
		email ?? "",
	);
}

export function mentionUserInSlack(user: {
	slackId: string | undefined;
	name: string | undefined;
}): string {
	return user.slackId ? `<@${user.slackId}>` : (user.name ?? "");
}

/**
 * If a user is missing fields, this function will populate them with default values and update the user in the DB.
 *
 * @param [updateDocument=true] If true, the user will be updated in the database. If false, the user will only be returned.
 * 	If true, will throw an error if the user is not in the DB.
 * @returns the updated user
 */
export async function repairUser(
	db: DbInterface,
	user: Partial<User>,
	updateDocument: boolean = true,
): Promise<User> {
	let id: ObjectId | string | undefined = user._id;

	if (user.id) {
		try {
			id = new ObjectId(user.id);
		} catch (e) {
			console.error("Invalid ObjectId:", user.id);
		}
	}

	const name = user.name ?? user.email?.split("@")[0] ?? "Unknown User";

	// User is incomplete, fill in the missing fields
	user = {
		...user,
		_id: id,
		id: id?.toString(),
		name,
		image: user.image ?? "https://4026.org/user.jpg",
		slug: user.slug ?? (await GenerateSlug(db, CollectionId.Users, name)),
		teams: user.teams ?? [],
		owner: user.owner ?? [],
		slackId: user.slackId ?? "",
		onboardingComplete: user.onboardingComplete ?? false,
		admin: user.admin ?? false,
		xp: user.xp ?? 0,
		level: user.level ?? 0,
	} as User;

	if (updateDocument)
		await db.updateObjectById(
			CollectionId.Users,
			new ObjectId(user._id?.toString()),
			user,
		);

	return user as User;
}
