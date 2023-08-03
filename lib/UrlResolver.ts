import { Collections, GetDatabase } from "./MongoDB";
import { Competition, Match, Season, Team, Report } from "./Types";

const gdb = GetDatabase();

export interface ResolvedUrlData {
    team: Team,
    season: Season | null,
    competition: Competition | null,
    match: Match | null,
    report: Report | null,
}

export function SerializeDatabaseObject(object: any): any {
    if(object?._id) {
        object._id = object?._id.toString();
    }
    
    return object;
}

export default async function UrlResolver(resolvedUrl: string): Promise<ResolvedUrlData> {
    const db = await gdb;
    const splittedUrl = resolvedUrl.split("/");
    splittedUrl.shift();

    const teamSlug = splittedUrl[0];
    const seasonSlug = splittedUrl[1];
    const competitionSlug = splittedUrl[2];
    const matchSlug = splittedUrl[3];
    const reportSlug = splittedUrl[4];

    return {
        team: SerializeDatabaseObject(await db.findObject<Team>(Collections.Teams, {"slug": teamSlug})),
        season: seasonSlug ? SerializeDatabaseObject(await db.findObject<Season>(Collections.Seasons, {"slug": seasonSlug})) : null,
        competition: competitionSlug ? SerializeDatabaseObject(await db.findObject<Competition>(Collections.Competitions, {"slug": competitionSlug})): null,
        match: matchSlug ? SerializeDatabaseObject(await db.findObject<Match>(Collections.Matches, {"slug": matchSlug})) : null,
        report: reportSlug ? SerializeDatabaseObject(await db.findObject<Report>(Collections.Reports, {"slug": reportSlug})) : null,
    }
}