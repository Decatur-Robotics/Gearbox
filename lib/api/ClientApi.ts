import { ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import AccessLevels from "./AccessLevels";
import ApiDependencies from "./ApiDependencies";
import ApiLib from "./ApiLib";
import { Team, User } from "@/lib/Types";
import { removeDuplicates } from "../client/ClientUtils";
import { ownsTeam } from "./ApiUtils";

/**
 * @tested_by tests/lib/api/ClientApi.test.ts
 */
export default class ClientApi extends ApiLib.ApiTemplate<ApiDependencies> {
  constructor() {
    super(false);
    this.init();
  }

  hello = ApiLib.createRoute<[], { message: string, db: string, data: any }, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { db }, authData, args) => {
      res.status(200).send({
        message: "howdy there partner",
        db: await db ? "connected" : "disconnected",
        data: args,
      });
    }
  });

  requestToJoinTeam = ApiLib.createRoute<[string], { result: string }, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorizedIfSignedIn,
    handler: async (req, res, { db, userPromise }, authData, [teamId]) => {
      let team = await (await db).findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(teamId)
      );

      if (!team) {
        return res.error(404, "Team not found");
      }
      
      if (team.users.indexOf((await userPromise)?._id?.toString() ?? "") > -1) {
        return res.status(200).send({ result: "Already on team" });
      }

      team.requests = removeDuplicates([...team.requests, (await userPromise)?._id?.toString()]);

      await (await db).updateObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(teamId),
        team
      )

      return res.status(200).send({ result: "Success" });
    }
  });

  handleTeamJoinRequest = ApiLib.createRoute<[boolean, string, string], Team | ApiLib.Errors.ErrorType, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [accept, teamId, userId]) => {
      const db = await dbPromise;

      const teamPromise = db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(teamId)
      );
      
      const joineePromise = db.findObjectById<User>(
        CollectionId.Users,
        new ObjectId(userId)
      );

      const userOnTeam = await userPromise;
      const team = await teamPromise;

      if (!team) {
        return res.error(404, "Team not found");
      }
      
      if (!ownsTeam(team, userOnTeam)) {
        return res.error(403, "You do not own this team");
      }

      const joinee = await joineePromise;

      if (!joinee) {
        return res.error(404, "User not found");
      }

      team.requests.splice(team.requests.indexOf(userId), 1);

      if (accept) {
        team.users = removeDuplicates(...team.users, userId);
        team.scouters = removeDuplicates(...team.scouters, userId);

        joinee.teams = removeDuplicates(...joinee.teams, teamId);
      }

      await Promise.all([
        db.updateObjectById<User>(
          CollectionId.Users,
          new ObjectId(userId),
          joinee
        ),
        db.updateObjectById<Team>(
          CollectionId.Teams,
          new ObjectId(teamId),
          team
        )
      ]);

      return res.status(200).send(team);
    }
  });
}