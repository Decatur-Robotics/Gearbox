import { getDatabase } from "@/lib/MongoDB";
import {
  Competition,
  Match,
  Team,
  Report,
  AllianceColor,
  QuantData,
} from "./Types";
import { ObjectId } from "bson";
import { rotateArray, shuffleArray } from "./client/ClientUtils";
import { games } from "./games";
import { GameId } from "./client/GameId";
import CollectionId from "./client/CollectionId";

export async function AssignScoutersToCompetitionMatches(
  teamId: string,
  competitionId: string,
  shuffle: boolean = false,
) {
  const db = await getDatabase();
  const comp = await db.findObjectById<Competition>(
    CollectionId.Competitions,
    new ObjectId(competitionId),
  );

  const team = await db.findObject<Team>(
    CollectionId.Teams,
    new ObjectId(teamId),
  );
  const matchIds = comp.matches;
  let scouters = team?.scouters ?? [];
  let subjectiveScouters = team?.subjectiveScouters ?? [];

  scouters = shuffle ? shuffleArray(scouters) : scouters;
  subjectiveScouters = shuffle ? shuffleArray(subjectiveScouters) : subjectiveScouters;

  const promises: Promise<any>[] = [];
  for (const matchId of matchIds) {
    // Filter out the subjective scouter that will be assigned to this match
    promises.push(AssignScoutersToMatch(
      matchId, scouters, subjectiveScouters, comp.gameId));
    rotateArray(scouters);
    rotateArray(subjectiveScouters);
  }

  await Promise.all(promises);
  return "Success";
}

export async function AssignScoutersToMatch(
  matchId: ObjectId,
  scouterArray: ObjectId[],
  subjectiveScouterArray: ObjectId[],
  gameId: GameId
): Promise<any> {
  const subjectiveScouter = subjectiveScouterArray.length > 0 ? subjectiveScouterArray[0] : undefined;
  const generateReportsPromise = generateReportsForMatch(matchId, gameId,
    subjectiveScouter ? scouterArray.filter((s) => subjectiveScouter !== s) : scouterArray);

  const assignSubjectiveScouterPromise = getDatabase().then((db) =>
    db.updateObjectById<Match>(
      CollectionId.Matches,
      new ObjectId(matchId),
      { subjectiveScouter }
    ));

  return Promise.all([generateReportsPromise, assignSubjectiveScouterPromise]);
}

export async function generateReportsForMatch(matchId: ObjectId | Match, gameId: GameId, scouters?: ObjectId[]) {
  const db = await getDatabase();
  let match: Match;
  if (ObjectId.prototype.isPrototypeOf(matchId)) {
    match = await db.findObjectById<Match>(CollectionId.Matches, matchId as ObjectId);
  } else {
    match = matchId as Match;
  }

  const existingReportPromises = match.reports.map((r) =>
    db.findObjectById<Report>(CollectionId.Reports, new ObjectId(r)));
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
        match._id,
        match.ownerTeam,
        match.ownerComp,
        0
      );

      reports.push((await db.addObject<Report>(CollectionId.Reports, newReport))._id);
    }
    else {
      // Update existing report
      oldReport.user = scouter;

      await db.updateObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(oldReport._id),
        oldReport,
      );
      reports.push(oldReport._id);
    }
  }

  match.reports = reports.filter((r) => r !== undefined);
  await db.updateObjectById<Match>(
    CollectionId.Matches,
    new ObjectId(match._id),
    match,
  );
}