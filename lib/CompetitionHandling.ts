import { getDatabase } from "@/lib/MongoDB";
import {
  Competition,
  Match,
  Team,
  Report,
  AllianceColor,
  QuantData,
  League,
} from "./Types";
import { ObjectId } from "mongodb";
import { rotateArray, shuffleArray } from "./client/ClientUtils";
import { games } from "./games";
import { GameId } from "./client/GameId";
import CollectionId from "./client/CollectionId";

type ScheduleMatch = {
  subjectiveScouter?: string;
  assignedScouters: string[];
}

/**
 * @tested_by tests/lib/CompetitionHandling.test.ts
 */
export function generateSchedule(scouters: string[], subjectiveScouters: string[], matchCount: number, robotsPerMatch: number) {
  const schedule = [];
  for (let i = 0; i < matchCount; i++) {
    const subjectiveScouter = subjectiveScouters.length > 0 ? subjectiveScouters[0] : undefined;
    const assignedScouters = (subjectiveScouter ? scouters.filter((s) => s !== subjectiveScouter) : scouters).slice(0, robotsPerMatch);

    const match = {
      subjectiveScouter,
      assignedScouters
    };
    schedule.push(match);
    rotateArray(scouters);
    rotateArray(subjectiveScouters);
  }

  return schedule;
}

export async function AssignScoutersToCompetitionMatches(
  teamId: string,
  competitionId: string,
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

  team.scouters = team.scouters.filter((s) => team.users.includes(s));
  team.subjectiveScouters = team.subjectiveScouters.filter((s) => team.users.includes(s));

  const schedule = generateSchedule(team.scouters, team.subjectiveScouters, comp.matches.length, games[comp.gameId].league == League.FRC ? 6 : 4);

  const promises: Promise<any>[] = [];
  for (let i = 0; i < comp.matches.length; i++) {
    // Filter out the subjective scouter that will be assigned to this match
    promises.push(generateReportsForMatch(comp.matches[i], comp.gameId, schedule[i]));
  }

  await Promise.all(promises);
  return "Success";
}

export async function generateReportsForMatch(match: string | Match, gameId: GameId, schedule?: ScheduleMatch) {
  const db = await getDatabase();
  if (typeof match === "string") {
    match = await db.findObjectById<Match>(
      CollectionId.Matches,
      new ObjectId(match),
    );
  }

  match.subjectiveScouter = schedule?.subjectiveScouter;

  const existingReportPromises = match.reports.map((r) =>
    db.findObjectById<Report>(CollectionId.Reports, new ObjectId(r)));
  const existingReports = await Promise.all(existingReportPromises);
    
  const bots = match.blueAlliance.concat(match.redAlliance);
  const reports = [];
  for (let i = 0; i < bots.length; i++) {
    const teamNumber = bots[i];
    const scouter = i < (schedule?.assignedScouters.length ?? 0) ? schedule?.assignedScouters[i] : undefined;
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
        String((await db.addObject<Report>(CollectionId.Reports, newReport))._id),
      );
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

  match.reports = reports.filter((r) => r !== undefined) as string[];
  await db.updateObjectById<Match>(
    CollectionId.Matches,
    new ObjectId(match._id),
    match,
  );
}