import { GetDatabase, Collections } from "@/lib/MongoDB";
import { Competition, Match, Team, Report } from "./Types";
import { ObjectId } from "mongodb";
import { RotateArray, ShuffleArray } from "./Utils";

export const MinimumNumberOfScouters = 6;


export async function AssignScoutersToCompetitionMatches(teamId: string, competitionId: string, formId: string) {
    const db = await GetDatabase();
    const comp = await db.findObjectById<Competition>(Collections.Competitions, new ObjectId(competitionId));
    const team = await db.findObject<Team>(Collections.Teams, new ObjectId(teamId));
    const matchIds = comp.matches;
    let scouters = team.scouters;

    if(scouters.length < MinimumNumberOfScouters) {
        console.log("Um no");
        return;
    }

    for(const matchId in matchIds) {
        await AssignScoutersToMatch(matchId, scouters, formId);
        RotateArray(scouters);
    }

}

export async function AssignScoutersToMatch(matchId: string, scouterArray: string[], formId: string, shuffleScouters: boolean = false): Promise<void> {
    const db = await GetDatabase();
    const scouters = shuffleScouters ? ShuffleArray(scouterArray): scouterArray;
    const match = await db.findObjectById<Match>(Collections.Matches, new ObjectId(matchId));
    const bots = match.blueAlliance.concat(match.redAlliance);

    var newReports = []
    for(let i = 0; i < 6; i++) {
        const scouter = scouters[i];
        const newReport = new Report(scouter, formId, bots[i], String(match._id));
        
        newReports.push(String((await db.addObject<Report>(Collections.Reports, newReport))._id));
    }

    match.reports = newReports;
    await db.updateObjectById<Match>(Collections.Matches, new ObjectId(matchId), match);
}