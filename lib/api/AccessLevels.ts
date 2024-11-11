import { NextApiRequest } from "next";
import { Competition, Match, Pitreport, Season, Team } from "../Types";
import ApiLib from "./ApiLib";
import ApiDependencies from "./ApiDependencies";
import CollectionId from "../client/CollectionId";
import { ObjectId } from "bson";
import { getCompFromMatch, getCompFromPitReport, getTeamFromComp, getTeamFromSeason } from "./ApiUtils";

namespace AccessLevels {  
  export function AlwaysAuthorized() {
    return Promise.resolve({ authorized: true, authData: undefined });
  }

  export async function IfSignedIn(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise }: ApiDependencies) {
    return { authorized: (await userPromise) !== undefined, authData: undefined };
  }

  export async function IfOnTeam(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: ApiDependencies, teamId: string) {
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

  export async function IfTeamOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: ApiDependencies, teamId: string) {
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

  export async function IfCompOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: ApiDependencies, compId: string) {
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

    return { authorized: team.owners.includes(user._id?.toString()!), authData: { team, comp } };
  }

  export async function IfSeasonOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: ApiDependencies, seasonId: string) {
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

  export async function IfMatchOwner(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: ApiDependencies, matchId: string) {
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

  export async function IfOnTeamThatOwnsMatch(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: ApiDependencies, matchId: string) {
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

  export async function IfOnTeamThatOwnsPitReport(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise, db }: ApiDependencies, pitReportId: string) {
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
}

export default AccessLevels;