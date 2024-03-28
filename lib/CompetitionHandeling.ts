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

  if (scouters.length < MinimumNumberOfScouters) {
    return "Cannot assign scouters: not enough scouters. You must have at least 6 scouters to assign to a competition.";
  }

  scouters = shuffle ? ShuffleArray(scouters) : scouters;

  for (const matchId of matchIds) {
    await AssignScoutersToMatch(matchId, scouters);
    RotateArray(scouters);
  }

  return "Success";
}

export async function AssignScoutersToMatch(
  matchId: string,
  scouterArray: string[],
  shuffleScouters: boolean = false,
): Promise<void> {
  const db = await GetDatabase();
  const scouters = shuffleScouters ? ShuffleArray(scouterArray) : scouterArray;
  let match = await db.findObjectById<Match>(
    Collections.Matches,
    new ObjectId(matchId),
  );

  const existingReportPromises = match.reports.map((r) =>
    db.findObjectById<Report>(Collections.Reports, new ObjectId(r)));
  const existingReports = await Promise.all(existingReportPromises);
    
  const bots = match.blueAlliance.concat(match.redAlliance);

  const reports = [];
  for (let i = 0; i < 6; i++) {
    const teamNumber = bots[i];
    const scouter = scouters[i];
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

      const updated = await db.updateObjectById<Report>(
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
    new ObjectId(matchId),
    match,
  );
}
