import { GetDatabase, Collections } from "@/lib/MongoDB";
import {
  Competition,
  Match,
  Team,
  Report,
  AllianceColor,
  FormData,
} from "./Types";
import { ObjectId } from "mongodb";
import { RotateArray, ShuffleArray } from "./Utils";

export const MinimumNumberOfScouters = 6;

export async function AssignScoutersToCompetitionMatches(
  teamId: string,
  competitionId: string,
  shuffle: boolean = false,
) {
  const db = await GetDatabase();
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

  if (scouters.length < MinimumNumberOfScouters) {
    return "Cannot assign scouters: not enough scouters. You must have at least 6 scouters to assign to a competition.";
  }

  scouters = shuffle ? ShuffleArray(scouters) : scouters;
  subjectiveScouters = shuffle || true ? ShuffleArray(subjectiveScouters) : subjectiveScouters;

  for (const matchId of matchIds) {
    // Filter out the subjective scouter that will be assigned to this match
    // console.log("Assigning scouters to match:", matchId, subjectiveScouters);
    let assignedScouter = (await db.findObjectById<Match>(Collections.Matches, new ObjectId(matchId))).subjectiveScouter;
    console.log("Reading B:", assignedScouter);
    await AssignScoutersToMatch(
      matchId, subjectiveScouters.length > 0 ? scouters.filter((s) => subjectiveScouters[0] !== s) : scouters, subjectiveScouters);
    RotateArray(scouters);
    RotateArray(subjectiveScouters);
    assignedScouter = (await db.findObjectById<Match>(Collections.Matches, new ObjectId(matchId))).subjectiveScouter;
    console.log("Reading A:", assignedScouter, "\n-------------------");
  }

  return "Success";
}

export async function AssignScoutersToMatch(
  matchId: string,
  scouterArray: string[],
  subjectiveScouterArray: string[]
): Promise<[void, Match]> {
  const generateReportsPromise = generateReportsForMatch(matchId, scouterArray);

  const db = await GetDatabase();
  const subjectiveScouter = subjectiveScouterArray.length > 0 ? subjectiveScouterArray[0] : undefined;

  try {
    console.log("Setting:", subjectiveScouter, { subjectiveScouter }, new ObjectId(matchId));

    const assignSubjectiveScouterPromise = 
      db.updateObjectById<Match>(
        Collections.Matches,
        new ObjectId(matchId),
        { subjectiveScouter }
      ).then((match) => {
        console.log("Done updating");
        return match;
      }).catch((e) => {
        throw e;
      });

    return Promise.all([generateReportsPromise, assignSubjectiveScouterPromise]);
  }
  catch (e) {
    console.error("Error assigning subjective scouter:", e);
  }

  return Promise.all([generateReportsPromise, Promise.resolve(null) as unknown as Promise<Match>]);
}

export async function generateReportsForMatch(match: string | Match, scouters?: string[]) {
  const db = await GetDatabase();
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
  for (let i = 0; i < 6; i++) {
    const teamNumber = bots[i];
    const scouter = scouters?.[i];
    const color = match.blueAlliance.includes(teamNumber)
      ? AllianceColor.Blue
      : AllianceColor.Red;

    const oldReport = existingReports.find((r) => r.robotNumber === teamNumber);

    if (!oldReport) {
      // Create a new report

      const newReport = new Report(
        scouter,
        new FormData(),
        teamNumber,
        color,
        String(match._id),
        0,
        false,
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