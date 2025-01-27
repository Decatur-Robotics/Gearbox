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
	name: string
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
			destination: `${destination}${Object.keys(query).length ? "?" : ""}${Object.keys(query)
				.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`)
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
	return user.slackId ? `<@${user.slackId}>` : user.name ?? "";
}
