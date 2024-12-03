import { ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import DbInterface from "../client/dbinterfaces/DbInterface";
import { GameId } from "../client/GameId";
import { TheBlueAlliance } from "../TheBlueAlliance";
import { User, Team, Report, Competition, DbPicklist, Match, Pitreport, Season, SubjectiveReport } from "../Types";
import { xpToLevel } from "../Xp";

export function onTeam(team?: Team | null, user?: User) {
  return team && user && user._id && team.users.find((owner) => owner === user._id?.toString()) !== undefined;
}

export function ownsTeam(team?: Team | null, user?: User) {
  return team && user && user._id && team.owners.find((owner) => owner === user._id?.toString()) !== undefined;
}

export function getCompFromReport(db: DbInterface, report: Report) {
  return db.findObject<Competition>(CollectionId.Competitions, {
    matches: report.match?.toString()
  });
}

export function getCompFromMatch(db: DbInterface, match: Match) {
  return db.findObject<Competition>(CollectionId.Competitions, {
    matches: match._id?.toString()
  });
}

export function getCompFromPitReport(db: DbInterface, report: Pitreport) {
  return db.findObject<Competition>(CollectionId.Competitions, {
    pitReports: report._id?.toString()
  });
}

export function getCompFromSubjectiveReport(db: DbInterface, report: SubjectiveReport) {
  return db.findObject<Match>(CollectionId.Matches, {
    subjectiveReports: report._id?.toString()
  }).then(match => {
    if (!match)
      return undefined;

    return getCompFromMatch(db, match);
  });
}

export function getCompFromPicklist(db: DbInterface, picklist: DbPicklist) {
  return db.findObject<Competition>(CollectionId.Competitions, {
    picklist: picklist._id?.toString()
  });
}

export function getSeasonFromComp(db: DbInterface, comp: Competition) {
  return db.findObject<Season>(CollectionId.Seasons, {
    competitions: comp?._id?.toString() // Specifying one value is effectively includes for arrays
  });
}

export function getTeamFromSeason(db: DbInterface, season: Season) {
  return db.findObject<Team>(CollectionId.Teams, {
    seasons: season._id?.toString()
  });
}

export async function getTeamFromComp(db: DbInterface, comp: Competition) {
  const season = await getSeasonFromComp(db, comp);

  if (!season)
    return undefined;

  return getTeamFromSeason(db, season);
}

export async function getTeamFromDocument(db: DbInterface, getComp: (db: DbInterface, doc: any) => Promise<any>, doc: any) {
  const comp = await getComp(db, doc);

  if (!comp)
    return undefined;

  return getTeamFromComp(db, comp);
}

export async function getTeamFromReport(db: DbInterface, report: Report) {
  return getTeamFromDocument(db, getCompFromReport, report);
}

export async function getTeamFromMatch(db: DbInterface, match: Match) {
  return getTeamFromDocument(db, getCompFromMatch, match);
}

export async function getTeamFromPitReport(db: DbInterface, report: Pitreport) {
  return getTeamFromDocument(db, getCompFromPitReport, report);
}

export async function getTeamFromPicklist(db: DbInterface, picklist: DbPicklist) {
  return getTeamFromDocument(db, getCompFromPicklist, picklist);
}

export async function getTeamFromSubjectiveReport(db: DbInterface, report: SubjectiveReport) {
  return getTeamFromDocument(db, getCompFromSubjectiveReport, report);
}

export async function generatePitReports(tba: TheBlueAlliance.Interface, db: DbInterface, tbaId: string, gameId: GameId): Promise<string[]> {
  var pitreports = await tba.getCompetitionPitreports(tbaId, gameId);
  pitreports.map(async (report) => (await db.addObject(CollectionId.PitReports, report))._id)

  return pitreports.map((pit) => String(pit._id));
}

export async function addXp(db: DbInterface, userId: string, xp: number) {
  const user = await db.findObjectById<User>(CollectionId.Users, new ObjectId(userId));

  if (!user)
    return;

  const newXp = user.xp + xp
  const newLevel = xpToLevel(newXp);

  await db.updateObjectById<User>(
    CollectionId.Users,
    new ObjectId(userId),
    { xp: newXp, level: newLevel }
  );
}