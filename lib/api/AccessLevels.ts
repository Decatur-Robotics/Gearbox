import { NextApiRequest } from "next";
import { Competition, DbPicklist, Match, Pitreport, Report, Season, SubjectiveReport, Team, User } from "../Types";
import ApiLib from "./ApiLib";
import ApiDependencies from "./ApiDependencies";
import CollectionId from "../client/CollectionId";
import { ObjectId } from "bson";
import { getCompFromMatch, getCompFromPitReport, getTeamFromComp, getTeamFromPicklist, getTeamFromReport, getTeamFromSeason, getTeamFromSubjectiveReport } from "./ApiUtils";
import DbInterface from "../client/dbinterfaces/DbInterface";
import { isDeveloper } from "../Utils";

type UserAndDb = { userPromise: Promise<User | undefined>, db: Promise<DbInterface> };

namespace AccessLevels {  
  export function AlwaysAuthorized() {
    return Promise.resolve({ authorized: true, authData: undefined });
  }

  export async function IfSignedIn(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise }: UserAndDb) {
    return { authorized: (await userPromise) !== undefined, authData: undefined };
  }

  export async function IfDeveloper(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise }: UserAndDb) {
    const user = await userPromise;
    return { authorized: isDeveloper(user?.email), authData: undefined };
  }

  export async function IfOnTeam(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, teamId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const team = await (await db).findObjectById<Team>(CollectionId.Teams, new ObjectId(teamId));
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.users.includes(user._id?.toString()!), authData: team };
  }

  export async function IfTeamOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, teamId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const team = await (await db).findObjectById<Team>(CollectionId.Teams, new ObjectId(teamId));
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.owners.includes(user._id?.toString()!), authData: team };
  }

  export async function IfCompOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, compId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const comp = await (await db).findObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId));
    if (!comp) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromComp(await db, comp);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    console.log(team.owners, user._id?.toString());

    return { authorized: team.owners.includes(user._id?.toString()!), authData: { team, comp } };
  }

  export async function IfSeasonOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, seasonId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const season = await (await db).findObjectById<Season>(CollectionId.Seasons, new ObjectId(seasonId));
    if (!season) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromSeason(await db, season);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.owners.includes(user._id?.toString()!), authData: { team, season } };
  }

  export async function IfMatchOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, matchId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const match = await (await db).findObjectById<Match>(CollectionId.Matches, new ObjectId(matchId));
    if (!match) {
      return { authorized: false, authData: undefined };
    }

    const comp = await getCompFromMatch(await db, match);
    if (!comp) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromComp(await db, comp);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.owners.includes(user._id?.toString()!), authData: { team, comp, match } };
  }

  export async function IfOnTeamThatOwnsComp(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, compId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const comp = await (await db).findObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId));
    if (!comp) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromComp(await db, comp);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.users.includes(user._id?.toString()!), authData: { team, comp } };
  }

  export async function IfOnTeamThatOwnsMatch(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, matchId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const match = await (await db).findObjectById<Match>(CollectionId.Matches, new ObjectId(matchId));
    if (!match) {
      return { authorized: false, authData: undefined };
    }

    const comp = await getCompFromMatch(await db, match);
    if (!comp) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromComp(await db, comp);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.users.includes(user._id?.toString()!), authData: { team, comp, match } };
  }

  export async function IfOnTeamThatOwnsPitReport(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, pitReportId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const pitReport = await (await db).findObjectById<Pitreport>(CollectionId.PitReports, new ObjectId(pitReportId));
    if (!pitReport) {
      return { authorized: false, authData: undefined };
    }
    
    const comp = await getCompFromPitReport(await db, pitReport);
    if (!comp) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromComp(await db, comp);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team?.users.includes(user._id?.toString()!), authData: { team, comp, pitReport } };
  }

  export async function IfOnTeamThatOwnsReport(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, reportId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const report = await (await db).findObjectById<Report>(CollectionId.Reports, new ObjectId(reportId));
    if (!report) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromReport(await db, report);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.users.includes(user._id?.toString()!), authData: { team, report } };
  }

  export async function IfOnTeamThatOwnsSubjectiveReport(req: NextApiRequest, res: ApiLib.ApiResponse<any>, {  userPromise, db }: UserAndDb, reportId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const report = await (await db).findObjectById<SubjectiveReport>(CollectionId.SubjectiveReports, new ObjectId(reportId));
    if (!report) {
      return { authorized: false, authData: undefined };
    }

    const team = await getTeamFromSubjectiveReport(await db, report);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.users.includes(user._id?.toString()!), authData: { team, report } };
  }

  export async function IfOnTeamThatOwnsPicklist(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: UserAndDb, picklistId: string) {
    const user = await userPromise;
    if (!user) {
      return { authorized: false, authData: undefined };
    }

    const picklist = await (await db).findObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(picklistId));
    if (!picklist) {
      return { authorized: false, authData: undefined };
    }
    
    const team = await getTeamFromPicklist(await db, picklist);
    if (!team) {
      return { authorized: false, authData: undefined };
    }

    return { authorized: team.users.includes(user._id?.toString()!), authData: { team, picklist } };
  }
}

export default AccessLevels;