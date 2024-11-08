import { ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import AccessLevels from "./AccessLevels";
import ApiDependencies from "./ApiDependencies";
import ApiLib from './ApiLib';
import { Competition, DbPicklist, League, Match, Season, Team, User } from "@/lib/Types";
import { NotLinkedToTba, removeDuplicates } from "../client/ClientUtils";
import { generatePitReports, ownsTeam } from "./ApiUtils";
import { TheOrangeAlliance } from "../TheOrangeAlliance";
import { GenerateSlug } from "../Utils";
import ResendUtils from "../ResendUtils";
import { fillTeamWithFakeUsers } from "../dev/FakeData";
import { GameId } from "../client/GameId";
import { generateReportsForMatch } from "../CompetitionHandling";

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
    isAuthorized: AccessLevels.IfSignedIn,
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
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [accept, teamId, userId]) => {
      const db = await dbPromise;

      const teamPromise = db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(teamId.toString())
      );
      
      const joineePromise = db.findObjectById<User>(
        CollectionId.Users,
        new ObjectId(userId.toString())
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

  teamAutofill = ApiLib.createRoute<[number, League], Team | undefined, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [number, league]) => {
      res.status(200).send(league === League.FTC 
        ? await TheOrangeAlliance.getTeam(number)
        : await tba.getTeamAutofillData(number)
      );
    }
  });

  competitionAutofill = ApiLib.createRoute<[string], Competition | undefined, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [tbaId]) => {
      res.status(200).send(await tba.getCompetitionAutofillData(tbaId));
    }
  });

  competitionMatches = ApiLib.createRoute<[string], Match | undefined, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [tbaId]) => {
      res.status(200).send(await tba.getMatchAutofillData(tbaId));
    }
  });

  createTeam = ApiLib.createRoute<[string, string, number, League], Team | ApiLib.Errors.ErrorType | undefined, ApiDependencies, void>({
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, resend, userPromise }, authData, [name, tbaId, number, league]) => {
      const user = (await userPromise)!;
      const db = await dbPromise;

      // Find if team already exists
      const existingTeam = await db.findObject<Team>(CollectionId.Teams, {
        number,
        ...(league === League.FRC 
          ? { $or: [
              { league: League.FRC }, 
              { league: undefined }
            ] } 
          : { league: league }
        )
      });

      if (existingTeam) {
        return res.status(400).send({ error: "Team already exists" });
      }

      const newTeamObj = new Team(
        name,
        await GenerateSlug(CollectionId.Teams, name),
        tbaId,
        number,
        league,
        [user._id!.toString()],
        [user._id!.toString()],
        [user._id!.toString()]
      );
      const team = await db.addObject<Team>(CollectionId.Teams, newTeamObj);

      user.teams = removeDuplicates(...user.teams, team._id!.toString());
      user.owner = removeDuplicates(...user.owner, team._id!.toString());

      await db.updateObjectById(
        CollectionId.Users,
        new ObjectId(user._id?.toString()),
        user
      );

      resend.emailDevelopers(`New team created: ${team.name}`, 
        `A new team has been created by ${user.name}: ${team.league} ${team.number}, ${team.name}.`);

      if (process.env.FILL_TEAMS === "true") {
        fillTeamWithFakeUsers(20, team._id.toString(), db);
      }

      return res.status(200).send(team);
    }
  });

  createSeason = ApiLib.createRoute<[number, string, string, GameId], ApiLib.Errors.ErrorType | Season, ApiDependencies, Team>({
    isAuthorized: (req, res, deps, [year, name, teamId]) => AccessLevels.IfTeamOwner(req, res, deps, teamId),
    handler: async (req, res, { db: dbPromise, userPromise }, team, [year, name, teamId, gameId]) => {
      const db = await dbPromise;

      if (!ownsTeam(team, (await userPromise))) {
        return res.status(403).send({ error: "Unauthorized" });
      }

      const season = await db.addObject<Season>(
        CollectionId.Seasons,
        new Season(
          name,
          await GenerateSlug(CollectionId.Seasons, name),
          year,
          gameId
        )
      );
      team!.seasons = [...team!.seasons, String(season._id)];

      await db.updateObjectById(
        CollectionId.Teams,
        new ObjectId(teamId),
        team!
      );

      return res.status(200).send(season);
    }
  });

  reloadCompetition = ApiLib.createRoute<[string], { result: string }, ApiDependencies, { comp: Competition, team: Team }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, tba }, { comp, team }, [compId]) => {

      const matches = await tba.getCompetitionMatches(comp.tbaId!);
      if (!matches || matches.length <= 0) {
        res.status(200).send({ result: "none" });
        return;
      }
      
      const db = await dbPromise;

      matches.map(
        async (match) =>
          (await db.addObject<Match>(CollectionId.Matches, match))._id
      );

      if (!comp.tbaId || comp.tbaId === NotLinkedToTba) {
        return res.status(200).send({ result: "not linked to TBA" });
      }

      const pitReports = await generatePitReports(tba, db, comp.tbaId, comp.gameId);

      await db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(compId),
        {
          matches: matches.map((match) => String(match._id)),
          pitReports: pitReports,
        }
      );
      res.status(200).send({ result: "success" });
    }
  });

  createCompetition = ApiLib.createRoute<[string, number, number, string, string, boolean], Competition, ApiDependencies, { team: Team, season: Season }>({
    isAuthorized: (req, res, deps, [tbaId, start, end, name, seasonId]) => AccessLevels.IfSeasonOwner(req, res, deps, seasonId),
    handler: async (req, res, { db: dbPromise, tba }, { team, season }, [tbaId, start, end, name, seasonId, publicData]) => {
      const db = await dbPromise;

      const matches = await tba.getCompetitionMatches(tbaId);
      matches.map(
        async (match) =>
          (await db.addObject<Match>(CollectionId.Matches, match))._id,
      );
      
      const pitReports = await generatePitReports(tba, db, tbaId, season.gameId);

      const picklist = await db.addObject<DbPicklist>(CollectionId.Picklists, {
        _id: new ObjectId(),
        picklists: {},
      });

      const comp = await db.addObject<Competition>(
        CollectionId.Competitions,
        new Competition(
          name,
          await GenerateSlug(CollectionId.Competitions, name),
          tbaId,
          start,
          end,
          pitReports,
          matches.map((match) => String(match._id)),
          picklist._id.toString(),
          publicData,
          season?.gameId
        )
      );

      season.competitions = [...season.competitions, String(comp._id)];

      await db.updateObjectById(
        CollectionId.Seasons,
        new ObjectId(season._id),
        season
      );

      // Create reports
      const reportCreationPromises = matches.map((match) =>
        generateReportsForMatch(db, match, comp.gameId)
      );
      await Promise.all(reportCreationPromises);

      return res.status(200).send(comp);
    }
  });
}