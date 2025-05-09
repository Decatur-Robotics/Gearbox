import { GetServerSidePropsContext, Redirect } from "next";
import { getDatabase } from "./MongoDB";
import { Competition, Match, Season, Team, Report } from "./Types";
import { ObjectId } from "bson";
import CollectionId from "./client/CollectionId";
import { redirect } from "next/dist/server/api-utils";
import { createRedirect } from "./Utils";
import slugToId from "./slugToId";

// fetches the database
const gdb = getDatabase();

/**
 * Structure to hold the final, resolved URL Data
 */
export interface ResolvedUrlData {
	team: Team | undefined;
	season: Season | undefined;
	competition: Competition | undefined;
	report: Report | undefined;
}

/**
 * Converts a internal/database object to something that works on the frontend
 *
 * @remarks
 * ObjectId's (what MongoDB uses as it's ID system, are not compatiable directly with the JSON parser from Next/TS
 * We must convert it to a string first
 *
 * @param object - Any `Object` with a `_id` property
 * @returns - The same object, but with `_id` set as a string
 */
export function serializeDatabaseObject(object: any): any {
	if (!object) {
		return null;
	}
	if (object?._id) {
		object._id = object?._id.toString();
	}
	if (object?.ownerTeam) {
		object.ownerTeam = object.ownerTeam.toString();
	}
	if (object?.ownerComp) {
		object.ownerComp = object.ownerComp.toString();
	}

	return object;
}

export function serializeDatabaseObjects(objectArray: any[]): any[] {
	return objectArray.map((obj) => serializeDatabaseObject(obj));
}

/**
 * Parses a URL for the SLUGs of various database objects, and returns them
 *
 * @remarks
 * This function is essential for finding page-specific data
 * Runs on the server-side- withen Next's data fetching functions
 *
 * @param context - A request context from Next- includes the final URL and the `req` URL
 * @returns - A `ResolvedURLData` struct
 */

export default async function UrlResolver(
	context: GetServerSidePropsContext,
	depthToCheckValidity: number,
): Promise<ResolvedUrlData | { redirect: Redirect }> {
	const db = await gdb;

	// split the url into the specific parts
	const splittedUrl = context.resolvedUrl.split("/");
	splittedUrl.shift();

	// each split cooresponds to a different slug for a specific object
	const teamSlug = splittedUrl[0];

	const seasonSlug = splittedUrl[1];
	const competitionSlug = splittedUrl[2];
	// very hacky- fix this
	const reportId = splittedUrl[3]?.length > 5 ? splittedUrl[3] : undefined;

	try {
		const promises = [
			db.findObjectBySlug(CollectionId.Teams, teamSlug),
			seasonSlug ? db.findObjectBySlug(CollectionId.Seasons, seasonSlug) : null,
			competitionSlug
				? db.findObjectBySlug(CollectionId.Competitions, competitionSlug)
				: null,
			reportId
				? db.findObjectById(CollectionId.Reports, new ObjectId(reportId))
				: null,
		];

		await Promise.all(promises);

		for (const promise of promises.slice(0, depthToCheckValidity)) {
			// If the value is just null, we didn't fetch the object in the first place
			if (
				promise instanceof Promise &&
				((await promise) === null || (await promise) === undefined)
			) {
				return createRedirect("/error", {
					message: `Page Not Found: ${context.resolvedUrl}`,
					code: 404,
				});
			}
		}

		// find these slugs, and convert them to a JSON safe condition
		// if they dont exist, simply return nothing
		const data: ResolvedUrlData = {
			team: serializeDatabaseObject(await promises[0]),
			season: serializeDatabaseObject(await promises[1]),
			competition: serializeDatabaseObject(await promises[2]),
			report: serializeDatabaseObject(await promises[3]),
		};
		return data;
	} catch (error) {
		console.error(error);

		return createRedirect("/error", {
			message: `Internal Server Error: ${error}`,
			code: 500,
		});
	}
}
