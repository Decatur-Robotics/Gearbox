import { GetServerSidePropsContext } from "next";
import { Collections, GetDatabase } from "./MongoDB";
import { Competition, Match, Season, Team, Report } from "./Types";

const gdb = GetDatabase();

export interface ResolvedUrlData {
    team: Team | undefined,
    season: Season | undefined,
    competition: Competition | undefined,
    match: Match | undefined,
    report: Report | undefined,
}

export function SerializeDatabaseObject(object: any): any {
    if(object?._id) {
        object._id = object?._id.toString();
    }
    
    return object;
}

export default async function UrlResolver(context: GetServerSidePropsContext): Promise<ResolvedUrlData> {
    const db = await gdb;
    const splittedUrl = context.resolvedUrl.split("/");
    splittedUrl.shift();

    const teamSlug = splittedUrl[0];
    const seasonSlug = splittedUrl[1];
    const competitionSlug = splittedUrl[2];
    const matchSlug = splittedUrl[3];
    const reportSlug = splittedUrl[4];

    try {
        var data: ResolvedUrlData = {
            team: SerializeDatabaseObject(await db.findObject<Team>(Collections.Teams, {"slug": teamSlug})),
            season: seasonSlug ? SerializeDatabaseObject(await db.findObject<Season>(Collections.Seasons, {"slug": seasonSlug})) : null,
            competition: competitionSlug ? SerializeDatabaseObject(await db.findObject<Competition>(Collections.Competitions, {"slug": competitionSlug})): null,
            match: matchSlug ? SerializeDatabaseObject(await db.findObject<Match>(Collections.Matches, {"slug": matchSlug})) : null,
            report: reportSlug ? SerializeDatabaseObject(await db.findObject<Report>(Collections.Reports, {"slug": reportSlug})) : null,
        }
        return data;
    } catch(error) {
        context.res.writeHead(301, {Location: "/not-found"});
        context.res.end();
        return {
            team: undefined,
            season: undefined,
            competition: undefined,
            match: undefined,
            report: undefined,
        }
    }
}