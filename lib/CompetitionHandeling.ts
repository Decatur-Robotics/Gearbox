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
    console.log("Um no");
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

  for(const rep of match.reports) {
    await db.deleteObjectById(Collections.Reports, new ObjectId(rep));
  }
    
  const bots = match.blueAlliance.concat(match.redAlliance);

  var newReports = [];
  for (let i = 0; i < 6; i++) {
    const scouter = scouters[i];
    const color = match.blueAlliance.includes(bots[i])
      ? AllianceColor.Blue
      : AllianceColor.Red;
    const newReport = new Report(
      scouter,
      new FormData(),
      bots[i],
      color,
      String(match._id),
      0,
      false,
    );

    newReports.push(
      String((await db.addObject<Report>(Collections.Reports, newReport))._id),
    );
  }

  match.reports = newReports;
  await db.updateObjectById<Match>(
    Collections.Matches,
    new ObjectId(matchId),
    match,
  );
}
