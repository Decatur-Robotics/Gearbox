import { getDatabase, Collections } from "@/lib/MongoDB";
import {
  Competition,
  Match,
  Team,
  Report,
  AllianceColor,
  QuantData,
} from "./Types";
import { ObjectId } from "mongodb";
import { RotateArray, ShuffleArray } from "./Utils";
import { games } from "./games";
import { GameId } from "./client/GameId";

export async function AssignScoutersToCompetitionMatches(
  teamId: string,
  competitionId: string,
  shuffle: boolean = false,
) {
  const db = await getDatabase();
  const comp = await db.findObjectById<Competition>(
    Collections.Competitions,
    new ObjectId(competitionId),
  );

  const team = await db.findObject<Team>(
    Collections.Teams,
    new ObjectId(teamId),
  );
  const matchIds = comp.matches;
  let scouters = team.scouters;
  let subjectiveScouters = team.subjectiveScouters;

  scouters = shuffle ? ShuffleArray(scouters) : scouters;
  subjectiveScouters = shuffle ? ShuffleArray(subjectiveScouters) : subjectiveScouters;

  const promises: Promise<any>[] = [];
  for (const matchId of matchIds) {
    // Filter out the subjective scouter that will be assigned to this match
    promises.push(AssignScoutersToMatch(
      matchId, scouters, subjectiveScouters, comp.gameId));
    RotateArray(scouters);
    RotateArray(subjectiveScouters);
  }

  await Promise.all(promises);
  return "Success";
}

export async function AssignScoutersToMatch(
  matchId: string,
  scouterArray: string[],
  subjectiveScouterArray: string[],
  gameId: GameId
): Promise<any> {
  const subjectiveScouter = subjectiveScouterArray.length > 0 ? subjectiveScouterArray[0] : undefined;
  const generateReportsPromise = generateReportsForMatch(matchId, gameId,
    subjectiveScouter ? scouterArray.filter((s) => subjectiveScouter !== s) : scouterArray);

  const assignSubjectiveScouterPromise = getDatabase().then((db) =>
    db.updateObjectById<Match>(
      Collections.Matches,
      new ObjectId(matchId),
      { subjectiveScouter }
    ));

  return Promise.all([generateReportsPromise, assignSubjectiveScouterPromise]);
}

export async function generateReportsForMatch(match: string | Match, gameId: GameId, scouters?: string[]) {
  const db = await getDatabase();
  if (typeof match === "string") {
    match = await db.findObjectById<Match>(
      Collections.Matches,
      new ObjectId(match),
    );
  }

  const existingReportPromises = match.reports.map((r) =>
    db.findObjectById<Report>(Collections.Reports, new ObjectId(r)));
  const existingReports = await Promise.all(existingReportPromises);
    
  const bots = match.blueAlliance.concat(match.redAlliance);
  const reports = [];
  for (let i = 0; i < bots.length; i++) {
    const teamNumber = bots[i];
    const scouter = i < (scouters?.length ?? 0) ? scouters?.[i] : undefined;
    const color = match.blueAlliance.includes(teamNumber)
      ? AllianceColor.Blue
      : AllianceColor.Red;

    const oldReport = existingReports.find((r) => r.robotNumber === teamNumber);

    if (!oldReport) {
      // Create a new report

      const newReport = new Report(
        scouter,
        games[gameId].createQuantitativeFormData(),
        teamNumber,
        color,
        String(match._id),
        0
      );

      reports.push(
        String((await db.addObject<Report>(Collections.Reports, newReport))._id),
      );
    }
    else {
      // Update existing report
      oldReport.user = scouter;

      await db.updateObjectById<Report>(
        Collections.Reports,
        new ObjectId(oldReport._id),
        oldReport,
      );
      reports.push(oldReport._id);
    }
  }

  match.reports = reports.filter((r) => r !== undefined) as string[];
  await db.updateObjectById<Match>(
    Collections.Matches,
    new ObjectId(match._id),
    match,
  );
}