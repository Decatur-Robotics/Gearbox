import { GetServerSidePropsContext } from "next";
import { Collections, GetDatabase } from "./MongoDB";
import { Competition, Match, Season, Team, Report } from "./Types";
import { ObjectId } from "mongodb";

// fetches the database
const gdb = GetDatabase();

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
export function SerializeDatabaseObject(object: any): any {
  if (!object) {
    return null;
  }
  if (object?._id) {
    object._id = object?._id.toString();
  }

  return object;
}

export function SerializeDatabaseObjects(objectArray: any[]): any[] {
  return objectArray.map((obj) => SerializeDatabaseObject(obj));
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
  context: GetServerSidePropsContext
): Promise<ResolvedUrlData> {
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
    // find these slugs, and convert them to a JSON safe condition
    // if they dont exist, simply return nothing
    var data: ResolvedUrlData = {
      team: SerializeDatabaseObject(
        await db.findObject<Team>(Collections.Teams, { slug: teamSlug })
      ),
      season: seasonSlug
        ? SerializeDatabaseObject(
            await db.findObject<Season>(Collections.Seasons, {
              slug: seasonSlug,
            })
          )
        : null,
      competition: competitionSlug
        ? SerializeDatabaseObject(
            await db.findObject<Competition>(Collections.Competitions, {
              slug: competitionSlug,
            })
          )
        : null,
      report: reportId
        ? SerializeDatabaseObject(
            await db.findObject<Report>(Collections.Reports, {
              _id: new ObjectId(reportId),
            })
          )
        : null,
    };
    return data;
  } catch (error) {
    return {
      team: undefined,
      season: undefined,
      competition: undefined,
      report: undefined,
    };
  }
}
