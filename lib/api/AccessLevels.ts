import { NextApiRequest } from "next";
import { Competition, Season, Team } from "../Types";
import ApiLib from "./ApiLib";
import ApiDependencies from "./ApiDependencies";
import CollectionId from "../client/CollectionId";
import { ObjectId } from "bson";
import { getTeamFromComp, getTeamFromSeason } from "./ApiUtils";

namespace AccessLevels {  
  export function AlwaysAuthorized() {
    return Promise.resolve({ authorized: true, authData: undefined });
  }

  export async function IfSignedIn(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise }: ApiDependencies) {
    return { authorized: (await userPromise) !== undefined, authData: undefined };
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
}

export default AccessLevels;