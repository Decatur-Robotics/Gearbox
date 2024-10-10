import { NextApiRequest, NextApiResponse } from "next";
import { getDatabase, MongoDBInterface } from "./MongoDB";
import { TheBlueAlliance } from "./TheBlueAlliance";
import {
  Competition,
  Match,
  Season,
  Team,
  User,
  Report,
  Pitreport,
  DbPicklist,
  SubjectiveReport,
  SubjectiveReportSubmissionType,
  SavedCompetition,
  QuantData,
  League
} from "./Types";
import { GenerateSlug } from "./Utils";
import { NotLinkedToTba, removeDuplicates } from "./client/ClientUtils";
import { BSON, EJSON, ObjectId } from "bson";
import { fillTeamWithFakeUsers } from "./dev/FakeData";
import { AssignScoutersToCompetitionMatches, generateReportsForMatch } from "./CompetitionHandeling";
import { WebClient } from "@slack/web-api";
import { getServerSession } from "next-auth";
import { AuthenticationOptions } from "./Auth";

import { Statbotics } from "./Statbotics";

import { xpToLevel } from "./Xp";
import { games } from "./games";
import { GameId } from "./client/GameId";
import { TheOrangeAlliance } from "./TheOrangeAlliance";
import ResendUtils from "./ResendUtils";
import CollectionId from "./client/CollectionId";
import { Collections } from "./client/Collections";
import DbInterface from "./client/DbInterface";
import { Document } from "mongodb";

export namespace API {
  export const GearboxHeader = "gearbox-auth";

  type RouteContents<TData = any> = {
    slackClient: WebClient;
    db: MongoDBInterface;
    tba: TheBlueAlliance.Interface;
    userPromise: Promise<User | undefined>;
    data: TData;
  };

  type Route = (
    req: NextApiRequest,
    res: NextApiResponseWrapper,
    contents: RouteContents
  ) => Promise<void>;
  type RouteCollection = { [routeName: string]: Route };

  class Error {
    constructor(
      res: NextApiResponse,
      errorCode: number = 500,
      description: string = "The server encountered an error while processing the request"
    ) {
      res.status(errorCode).send({ error: description });
    }
  }

  class NotFoundError extends Error {
    constructor(res: NextApiResponse, routeName: string) {
      super(res, 404, `This API Route (/${routeName}) does not exist`);
    }
  }

  class InvalidRequestError extends Error {
    constructor(res: NextApiResponse) {
      super(res, 400, "Invalid Request");
    }
  }

  class UnauthorizedError extends Error {
    constructor(res: NextApiResponse) {
      super(res, 401, "Please provide a valid 'Gearbox-Auth' Header Key");
    }
  }

  /**
   * Provides send() with EJSON support. Also provides status().
   */
  class NextApiResponseWrapper {
    res: NextApiResponse;

    constructor(res: NextApiResponse) {
      this.res = res;
    }

    status(code: number) {
      this.res.status(code);
      return this;
    }

    send(data: any) {
      return this.res.send(EJSON.stringify(data));
    }
  }

  export class Handler {
    // feed routes as big object to the handler
    routes: RouteCollection;
    db: Promise<MongoDBInterface>;
    tba: TheBlueAlliance.Interface;
    slackClient: WebClient;
    basePath: string;

    constructor(apiRoutes: RouteCollection, base = "/api/") {
      this.routes = apiRoutes;
      this.db = getDatabase();
      this.tba = new TheBlueAlliance.Interface();
      this.basePath = base;
      this.slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
    }

    async handleRequest(req: NextApiRequest, res: NextApiResponse) {
      if (!req.url) {
        new InvalidRequestError(res);
        return;
      }

      // ignore requests coming from anyone on the homepage
      //@ts-ignore
      //prettier-ignore
      if (!req.headers.referer?.includes("/event/") && req.headers.referer?.split("/")[3].length > 0) {
        if (
          req.headers[GearboxHeader]?.toString() !== process.env.API_KEY
        ) {
          new UnauthorizedError(res);
        }
      }

      const routeRaw = req.url.replace(this.basePath, "");
      const route = routeRaw.includes("?") 
        ? routeRaw.substring(0, routeRaw.indexOf("?")) 
        : routeRaw;

      if (route in this.routes) {
        const session = getServerSession(req, res, AuthenticationOptions);

        // Stringify and parse the body to convert EJSON to objects
        req.body = EJSON.parse(EJSON.stringify(req.body));

        try {
          const contents: RouteContents = {
            slackClient: this.slackClient,
            db: await this.db,
            tba: this.tba,
            userPromise: session.then((s) => s?.user as User | undefined),
            data: req.body,
          };

          this.routes[route](req, new NextApiResponseWrapper(res), contents);
        } catch (e) {
          console.log("Error executing route:", e);
          res.status(500).send({ error: e });
        }
      } else {
        new NotFoundError(res, route);
        return;
      }
    }
  }

  async function addXp(userId: string, xp: number) {
    const db = await getDatabase();
    const user = await db.findObjectById<User>(CollectionId.Users, new ObjectId(userId));

    const newXp = (user?.xp ?? 0) + xp
    const newLevel = xpToLevel(newXp);

    await db.updateObjectById<User>(
      CollectionId.Users,
      new ObjectId(userId),
      { xp: newXp, level: newLevel }
    );
  }

  async function generatePitReports(tba: TheBlueAlliance.Interface, db: MongoDBInterface, tbaId: string, gameId: GameId, 
      ownerTeam: ObjectId, ownerComp: ObjectId): Promise<ObjectId[]> {
    var pitreports = await tba.getCompetitionPitreports(tbaId, gameId, ownerTeam, ownerComp);
    pitreports.map(async (report) => (await db.addObject<Pitreport>(CollectionId.Pitreports, { ...report, ownerTeam  }))._id)

    return pitreports.map((report) => report._id);
  }

  type FindRouteContents = RouteContents<{ collection: CollectionId, query: any }>;

  async function findInDb(req: NextApiRequest, res: NextApiResponseWrapper, contents: FindRouteContents,
    find: (db: DbInterface, collectionId: CollectionId, query: object) => Promise<Document | Document[] | null | undefined>
  ) {
    const { userPromise, data, db } = contents;

    const collectionId = data.collection as CollectionId;
      const collection = Collections[collectionId];
      const query = data.query;

      let obj = await find(db, collectionId, query);
      if (!obj) {
        obj = {};

        res.status(200).send(obj);
      }

      const user = await userPromise;

      if (!(await collection.canRead(user?._id, obj, db))) {
        // If we ``, lines breaks and tabs are preserved in the string
        console.error(`Unauthorized read to object:
          User: ${user?.name} (${user?._id})
          Query: ${JSON.stringify(query)}
          Collection: ${collectionId}`);
        return res.status(403).send({ error: "Unauthorized", query, collectionId });
      }

      res.status(200).send(obj);
  }

  export const Routes: RouteCollection = {
    hello: async (req, res, { db, data }) => {
      res.status(200).send({
        message: "howdy there partner",
        db: db ? "connected" : "disconnected",
        data: data,
      });
    },

    // crud operations- no need to make extra endpoints when we can just shape the query client side;
    // FORCE THEM TO USE POST
    add: async (req, res, { db, data }) => {
      // {
      //     collection,
      //     object
      // }
      const collection = data.collection;
      const object = data.object;

      res.status(200).send(await db.addObject(collection, object));
    },

    update: async (req, res, { db, data, userPromise }: RouteContents<{ collection: CollectionId, id: string, newValues: { [key: string]: any } }>) => {
      const collectionId = data.collection;
      const id = data.id;
      const newValues = data.newValues;

      const current = await db.findObjectById(collectionId, new ObjectId(id));
      if (!current) {
        return res.status(404).send({ error: "Not found" });
      }

      const user = await userPromise;

      if (!(await Collections[collectionId].canWrite(user?._id, current, newValues, db))) {
        return res.status(403).send({ error: "Unauthorized" });
      }

      const set = Object.keys(newValues).reduce<{ [key: string]: any }>((acc, key) => {
        if (key === "_id" || key.startsWith("$")) return acc;
        acc[key] = newValues[key];
        return acc;
      }, {});

      const otherUpdates = Object.keys(newValues).reduce<{ [key: string]: any }>((acc, key) => {
        if (key.startsWith("$")) {
          acc[key] = newValues[key];
        }
        return acc;
      }, {});

      res
        .status(200)
        .send(
          await db.db?.collection(collectionId).updateOne(
            { _id: new ObjectId(id) },
            { $set: set, ...otherUpdates }
          )
        );
    },

    delete: async (req, res, { db, data }) => {
      // {
      //     collection,
      //     id
      // }
      const collection = data.collection;
      const id = data.id;

      res.status(200).send(await db.deleteObjectById(collection, id));
    },

    findOne: async (req, res, contents: FindRouteContents) => {
      findInDb(req, res, contents, (db, collectionId, query) => db.findObject(collectionId, query));
    },

    findMultiple: async (req, res, contents: FindRouteContents) => {
      findInDb(req, res, contents, (db, collectionId, query) => db.findObjects(collectionId, query));
    },

    /**
     * @deprecated did not have security checks and was never used. Use find instead
     */
    findAll: async (req, res, { db, data }) => {
      // {
      //     collection,

      // }
      // const collection = data.collection;

      // res.status(200).send(await db.findObjects(collection, {}));
      res.status(200).send({ error: "Deprecated" });
    },

    // modification

    requestToJoinTeam: async (req, res, { db, data }) => {
      // {
      //     teamId
      //     userId
      // }

      const team = await db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId)
      );
      
      if (!team) {
        return res.status(404).send({ error: "Team not found" });
      }

      team.requests = removeDuplicates([...team.requests, data.userId]);

      await db.updateObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId),
        team
      )

      return res.status(200).send({ result: "success" });
    },

    handleRequest: async (req, res, { db, data }) => {
      // {
      //     accept
      //     userId
      //     teamId
      // }

      const team = await db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId)
      );
      const user = await db.findObjectById<User>(
        CollectionId.Users,
        new ObjectId(data.userId)
      );

      if (!team || !user) {
        return res.status(404).send({ error: "Team or user not found" });
      }

      team.requests.splice(team.requests.indexOf(data.userId), 1);

      if (data.accept) {
        team.users = removeDuplicates(...team.users, data.userId);
        team.scouters = removeDuplicates(...team.scouters, data.userId);

        user.teams = removeDuplicates(...user.teams, data.teamId);
      }

      await db.updateObjectById<User>(
        CollectionId.Users,
        new ObjectId(data.userId),
        user
      );
      await db.updateObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId),
        team
      );

      return res.status(200).send(team);
    },

    // tba shit

    teamAutofill: async (req, res, { tba, data }) => {
      // {
      //     number
      // }
      return res.status(200).send(data.league === League.FTC 
        ? await TheOrangeAlliance.getTeam(data.number)
        : await tba.getTeamAutofillData(data.number)
      );
    },

    competitionAutofill: async (req, res, { tba, data }) => {
      // {
      //     tbaId
      // }
      return res
        .status(200)
        .send(await tba.getCompetitionAutofillData(data.tbaId));
    },

    competitionMatches: async (req, res, { tba, data }) => {
      // {
      //     tbaId
      // }
      return res.status(200).send(await tba.getCompetitionMatches(data.tbaId));
    },

    matchAutofill: async (req, res, { tba, data }) => {
      // {
      //    tbaId
      // }
      return res.status(200).send(await tba.getMatchAutofillData(data.tbaId));
    },

    // creation
    createTeam: async (req, res, { db, userPromise, data }: RouteContents<{ name: string, tbaId: string, number: number, league: League }>) => {
      const user = await userPromise;

      if (!user || !user._id) {
        return res.status(403).send({ error: "Not signed in" });
      }

      // Find if team already exists
      const existingTeam = await db.findObject<Team>(CollectionId.Teams, {
        number: data.number,
        ...(data.league === League.FRC 
          ? { $or: [
              { league: League.FRC }, 
              { league: undefined }
            ] } 
          : { league: data.league }
        )
      });

      if (existingTeam) {
        return res.status(400).send({ error: "Team already exists" });
      }

      const newTeamObj = new Team(
        data.name,
        await GenerateSlug(CollectionId.Teams, data.name),
        data?.tbaId,
        data.number,
        data.league,
        [user._id],
        [user._id],
        [user._id]
      );
      const team = await db.addObject<Team>(CollectionId.Teams, newTeamObj);

      user.teams = removeDuplicates(...user.teams, team._id!.toString());
      user.owner = removeDuplicates(...user.owner, team._id!.toString());

      await db.updateObjectById(
        CollectionId.Users,
        new ObjectId(user._id),
        user
      );

      ResendUtils.emailDevelopers(`New team created: ${team.name}`, 
        `A new team has been created by ${user.name}: ${team.league} ${team.number}, ${team.name}.`);

      if (process.env.FILL_TEAMS === "true") {
        fillTeamWithFakeUsers(20, team._id!.toString());
      }

      return res.status(200).send(team);
    },

    // NEEDS TO BE ADDED TO TEAM DUMBASS
    createSeason: async (req, res, { db, data }: RouteContents<{ year: number, gameId: GameId, teamId: ObjectId, name: string }>) => {
      // {
      //     year
      //     name
      //     teamId;
      // }
      const season = await db.addObject<Season>(
        CollectionId.Seasons,
        new Season(
          data.name,
          await GenerateSlug(CollectionId.Seasons, data.name),
          data.year,
          data.gameId,
          data.teamId
        )
      );
      const team = await db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId)
      );

      if (!team || !season) {
        return res.status(404).send({ error: "Team or season not found" });
      }

      team.seasons = [...team.seasons, season._id];

      await db.updateObjectById(
        CollectionId.Teams,
        new ObjectId(data.teamId),
        team
      );

      return res.status(200).send(season);
    },

    reloadCompetition: async (req, res, { db, data, tba }) => {
      // {comp id, tbaId}

      const compPromise = db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));

      const matches = await tba.getCompetitionMatches(data.tbaId);
      if (!matches || matches.length <= 0) {
        res.status(200).send({ result: "none" });
        return;
      }

      matches.map(
        async (match) =>
          (await db.addObject<Match>(CollectionId.Matches, match))._id
      );

      const comp = await compPromise;
      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      const pitReports = await generatePitReports(tba, db, data.tbaId, comp.gameId, comp.ownerTeam, comp._id);

      await db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(data.compId),
        {
          matches: matches.map((match) => String(match._id)),
          pitReports: pitReports,
        }
      );
      res.status(200).send({ result: "success" });
    },

    createCompetiton: async (req, res, { db, data, tba }) => {
      // {
      //     tbaId?
      //     start
      //     end
      //     name
      //     seasonId
      //     publicData
      // }
      
      const seasonPromise = db.findObjectById<Season>(CollectionId.Seasons, new ObjectId(data.seasonId));

      var matches = await tba.getCompetitionMatches(data.tbaId);
      matches.map(
        async (match) =>
          (await db.addObject<Match>(CollectionId.Matches, match))._id,
      );
      
      const compId = new ObjectId();

      const season = await seasonPromise;
      if (!season)
        return res.status(404).send({ error: "Season not found" });

      const pitReports = await generatePitReports(tba, db, data.tbaId, season.gameId, season.ownerTeam, compId);

      const picklist = await db.addObject<DbPicklist>(CollectionId.Picklists, {
        _id: new ObjectId(),
        picklists: {},
      });

      var comp = await db.addObject<Competition>(
        CollectionId.Competitions,
        {
          ...new Competition(
            data.name,
            await GenerateSlug(CollectionId.Competitions, data.name),
            data.tbaId,
            data.start,
            data.end,
            season.ownerTeam ?? "",
            pitReports,
            matches.map((match) => match._id),
            picklist._id,
            data.publicData,
            season?.gameId
          ),
          _id: compId,
        }
      );

      season.competitions = [...season.competitions, String(comp._id)];

      await db.updateObjectById(
        CollectionId.Seasons,
        new ObjectId(season._id),
        season
      );

      // Create reports
      const reportCreationPromises = matches.map((match) =>
        generateReportsForMatch(match, comp.gameId)
      );
      await Promise.all(reportCreationPromises);

      return res.status(200).send(comp);
    },

    regeneratePitReports: async (req, res, { db, data, tba }) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));
      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      const pitReports = await generatePitReports(tba, db, data.tbaId, comp.gameId, data.ownerTeam, comp._id);

      await db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(data.compId),
        { pitReports: pitReports }
      );

      return res.status(200).send({ result: "success", pitReports });
    },

    createMatch: async (req, res, { db, data }) => {
      // {
      //     tbaId?
      //     number
      //     time
      //     type
      // }
      const match = await db.addObject<Match>(
        CollectionId.Matches,
        new Match(
          data.number,
          await GenerateSlug(CollectionId.Matches, data.number.toString()),
          data.tbaId,
          data.time,
          data.type,
          data.redAlliance,
          data.blueAlliance,
          data.ownerTeam,
          data.ownerComp
        )
      );

      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );
      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      comp.matches.push(match._id);

      const reportPromise = generateReportsForMatch(match, comp.gameId);

      await Promise.all([db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(comp._id),
        comp
      ), reportPromise]);

      return res.status(200).send(match);
    },

    searchCompetitionByName: async (req, res, { tba, data }) => {
      // {
      //    name
      // }
      return res.status(200).send(await tba.searchCompetitionByName(data.name));
    },

    assignScouters: async (req, res, { tba, data }) => {
      // {
      //    teamId
      //    compId
      //    shuffle
      // }

      const result = await AssignScoutersToCompetitionMatches(
        data.teamId,
        data.compId,
        data.shuffle
      );

      console.log(result);
      return res.status(200).send({ result: result });
    },

    submitForm: async (req, res, { db, data }) => {
      // {
      //    reportId
      //    formData
      // }

      const form = await db.findObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(data.reportId)
      );

      if (!form)
        return res.status(404).send({ error: "Report not found" });
      
      form.data = data.formData;
      form.submitted = true;
      form.submitter = data.userId;

      await db.updateObjectById(
        CollectionId.Reports,
        new ObjectId(data.reportId),
        form
      );
      const user = await db.findObjectById<User>(
        CollectionId.Users,
        new ObjectId(data.userId)
      );

      if (!user)
        return res.status(404).send({ error: "User not found" });

      addXp(data.userId, 10);

      await db.updateObjectById(
        CollectionId.Users,
        new ObjectId(data.userId),
        user
      );
      return res.status(200).send({ result: "success" });
    },

    competitionReports: async (req, res, { db, data }) => {
      // {
      // compId
      // submitted
      // usePubl
      // }

      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      const usedComps = data.usePublicData && comp.tbaId !== NotLinkedToTba 
        ? await db.findObjects<Competition>(CollectionId.Competitions, { publicData: true, tbaId: comp.tbaId, gameId: comp.gameId })
        : [comp];

      if (data.usePublicData && !comp.publicData)
        usedComps.push(comp);

      const reports = (await db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: usedComps.flatMap((m) => m.matches) },
        submitted: data.submitted ? true : { $exists: true },
      }))
        // Filter out comments from other competitions
        .map((report) => comp.matches.includes(report.match) ? report :  { ...report, data: { ...report.data, comments: "" } } );
      return res.status(200).send(reports);
    },

    allCompetitionMatches: async (req, res, { db, data }) => {
      // {
      // compId
      // }

      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      const matches = await db.findObjects<Match[]>(CollectionId.Matches, {
        _id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
      });
      return res.status(200).send(matches);
    },

    matchReports: async (req, res, { db, data }) => {
      // {
      // compId
      // }

      const match = await db.findObjectById<Match>(
        CollectionId.Matches,
        new ObjectId(data.matchId)
      );

      if (!match)
        return res.status(404).send({ error: "Match not found" });

      const reports = await db.findObjects<Report[]>(CollectionId.Reports, {
        _id: { $in: match.reports.map((reportId) => new ObjectId(reportId)) },
      });
      return res.status(200).send(reports);
    },

    changePFP: async (req, res, { db, data }) => {
      await db.updateObjectById<User>(
        CollectionId.Users,
        new ObjectId(data.userId),
        { image: `${data.newImage}` }
      );
    },

    checkInForReport: async (req, res, { db, data }) => {
      await db.updateObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(data.reportId),
        { checkInTimestamp: new Date().toISOString() }
      );
    },

    checkInForSubjectiveReport: async (req, res, { db, data }) => {
      // {
      //     matchId
      // }
      const user = (await getServerSession(req, res.res, AuthenticationOptions))?.user as User;

      const update: { [key: string]: any } = {};
      update[`subjectiveReportsCheckInTimestamps.${user._id?.toString()}`] = new Date().toISOString();
      await db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(data.matchId), update);

      return res.status(200).send({ result: "success" });
    },

    remindSlack: async (req, res, { db, slackClient, data }) => {
      const team = await db.findObjectById<Team>(CollectionId.Teams, new ObjectId(data.teamId));
      if (!team)
        return res.status(200).send({ error: "Team not found" });
      if (!team.slackChannel)
        return res.status(200).send({ error: "Team has not linked their Slack channel" });

      const msgRes = await slackClient.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: team.slackChannel,
        text: `<@${data.slackId}>, please report to our section and prepare for scouting. Sent by <@${data.senderSlackId}>`,
      });

      return res.status(200).send({ result: "success", msgRes });
    },

    setSlackId: async (req, res, { db, data }) => {
      await db.updateObjectById<User>(
        CollectionId.Users,
        new ObjectId(data.userId),
        { slackId: data.slackId }
      );
    },

    addUserXp: async (req, res, { db, data }) => {
      addXp(data.userId, data.oweBucksToAdd);
    },

    initialEventData: async (req, res, { tba, data }) => {
      const compRankingsPromise = tba.req.getCompetitonRanking(data.eventKey);
      const eventInformationPromise = tba.getCompetitionAutofillData(
        data.eventKey
      );
      const tbaOPRPromise = tba.req.getCompetitonOPRS(data.eventKey);

      return res.status(200).send({
        firstRanking: (await compRankingsPromise).rankings,
        comp: await eventInformationPromise,
        oprRanking: await tbaOPRPromise,
      });
    },

    compRankings: async (req, res, { tba, data }) => {
      const compRankings = await tba.req.getCompetitonRanking(data.tbaId);
      return res.status(200).send(compRankings.rankings);
    },

    statboticsTeamEvent: async (req, res, { data }) => {
      const teamEvent = await Statbotics.getTeamEvent(data.eventKey, data.team);
      return res.status(200).send(teamEvent);
    },

    getMainPageCounterData: async (req, res, { db, data }) => {
      const teamsPromise = db.countObjects(CollectionId.Teams, {});
      const usersPromise = db.countObjects(CollectionId.Users, {});
      const reportsPromise = db.countObjects(CollectionId.Reports, {});
      const pitReportsPromise = db.countObjects(CollectionId.Pitreports, {});
      const subjectiveReportsPromise = db.countObjects(CollectionId.SubjectiveReports, {});
      const competitionsPromise = db.countObjects(CollectionId.Competitions, {});

      const dataPointsPerReport = Reflect.ownKeys(QuantData).length;
      const dataPointsPerPitReports = Reflect.ownKeys(Pitreport).length;
      const dataPointsPerSubjectiveReport = Reflect.ownKeys(SubjectiveReport).length + 5;

      await Promise.all([teamsPromise, usersPromise, reportsPromise, pitReportsPromise, subjectiveReportsPromise, competitionsPromise]);

      return res.status(200).send({
        teams: await teamsPromise,
        users: await usersPromise,
        datapoints: ((await reportsPromise) ?? 0) * dataPointsPerReport 
                    + ((await pitReportsPromise) ?? 0) * dataPointsPerPitReports
                    + ((await subjectiveReportsPromise) ?? 0) * dataPointsPerSubjectiveReport,
        competitions: await competitionsPromise,
      });
    },

    exportCompAsCsv: async (req, res, { db, data }) => {
      // Get all the reports for the competition
      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      if (!comp) {
        return res.status(404).send({ error: "Competition not found" });
      }

      const matches = await db.findObjects<Match>(CollectionId.Matches, {
        _id: { $in: comp.matches },
      });
      const allReports = await db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: matches.map((match) => match?._id?.toString() ?? "") },
      });
      const reports = allReports.filter((report) => report.submitted);

      if (reports.length == 0) {
        return res
          .status(200)
          .send({ error: "No reports found for competition" });
      }

      // Convert reports to row data
      interface Row extends QuantData {
        timestamp: number | undefined;
        team: number;
      }

      const rows: Row[] = [];
      for (const report of reports) {
        const row = {
          ...report.data,
          timestamp: report.timestamp,
          team: report.robotNumber,
        };
        rows.push(row);
      }

      // Find headers
      const headers = Object.keys(rows[0]);

      // Convert to CSV
      let csv = headers.join(",") + "\n";

      for (const row of rows) {
        // Get values in same order as headers
        const data = headers.map((header) => row[header]);

        csv += data.join(",") + "\n";
      }

      // Send CSV
      res.status(200).send({ csv });
    },

    teamCompRanking: async (req, res, { tba, data }) => {
      const tbaResult = await tba.req.getCompetitonRanking(data.tbaId);
      if (!tbaResult || !tbaResult.rankings) {
        return res.status(200).send({ place: "?", max: "?" });
      }

      const { rankings } = tbaResult;

      const rank = rankings?.find((ranking) => ranking.team_key === `frc${data.team}`)?.rank;

      if (!rank) {
        return res.status(200).send({
          place: "?",
          max: rankings?.length,
        });
      }

      return res.status(200).send({
        place: rankings?.find((ranking) => ranking.team_key === `frc${data.team}`)?.rank,
        max: rankings?.length,
      });
    },

    getPitReports: async (req, res, { db, data }) => {
      const objIds = data.reportIds.map((reportId: string) => new ObjectId(reportId));

      const pitReports = await db.findObjects<Pitreport>(CollectionId.Pitreports, {
        _id: { $in: objIds },
      });

      return res.status(200).send(pitReports);
    },

    changeScouterForReport: async (req, res, { db, data }) => {
      await db.updateObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(data.reportId),
        { user: data.scouterId }
      );

      return res.status(200).send({ result: "success" });
    },
  
    getCompReports: async (req, res, { db, data }) => {
      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      const reports = await db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: comp.matches },
      });

      return res.status(200).send(reports);
    },

    findScouterManagementData: async (req, res, { db, data }) => {
      const typedData = data as {
        compId: string,
        scouterIds: string[]
      };

      const promises: Promise<any>[] = [];

      const scouters: User[] = [];
      const matches: Match[] = [];
      const quantitativeReports: Report[] = [];
      const pitReports: Pitreport[] = [];
      const subjectiveReports: SubjectiveReport[] = [];

      for (const scouterId of typedData.scouterIds) {
        promises.push(db.findObjectById<User>(CollectionId.Users, new ObjectId(scouterId)).then((scouter) => scouter && scouters.push(scouter)));
      }

      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(typedData.compId));

      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      for (const matchId of comp.matches) {
        if (matchId)
          promises.push(db.findObjectById<Match>(CollectionId.Matches, new ObjectId(matchId)).then((match) => match && matches.push(match)));
      }

      promises.push(db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: comp.matches },
      }).then((r) => quantitativeReports.push(...r)));

      promises.push(db.findObjects<Pitreport>(CollectionId.Pitreports, {
        _id: { $in: comp.pitReports },
        submitted: true
      }).then((r) => pitReports.push(...r)));

      promises.push(db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        match: { $in: comp.matches }
      }).then((r) => subjectiveReports.push(...r)));

      await Promise.all(promises);

      return res.status(200).send({ scouters, matches, quantitativeReports, pitReports, subjectiveReports });
    },

    getPicklist: async (req, res, { db, data }) => {
      const picklist = await db.findObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(data.id));
      return res.status(200).send(picklist);
    },

    updatePicklist: async (req, res, { db, data }) => {
      const { _id, ...picklist } = data.picklist;
      await db.updateObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(data.picklist._id), picklist);
      return res.status(200).send({ result: "success" });
    },

    setCompPublicData: async (req, res, { db, data }) => {
      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId), { publicData: data.publicData });
      return res.status(200).send({ result: "success" });
    },
  
    setOnboardingCompleted: async (req, res, { db, data }: RouteContents<{userId: string}>) => {
      await db.updateObjectById<User>(CollectionId.Users, new ObjectId(data.userId), { onboardingComplete: true });
      return res.status(200).send({ result: "success" });
    },
    
    submitSubjectiveReport: async (req, res, { db, data }) => {
      const rawReport = data.report as SubjectiveReport;

      const matchPromise = db.findObjectById<Match>(CollectionId.Matches, new ObjectId(rawReport.match));
      const teamPromise = db.findObject<Team>(CollectionId.Teams, {
        slug: data.teamSlug
      });

      const [match, team] = await Promise.all([matchPromise, teamPromise]);

      if (!match || !team)
        return res.status(404).send({ error: "Match or team not found" });

      const report: SubjectiveReport = {
        ...data.report,
        _id: new ObjectId(),
        submitter: data.userId,
        submitted: match.subjectiveScouter === data.userId 
          ? SubjectiveReportSubmissionType.ByAssignedScouter
          : team?.subjectiveScouters.includes(data.userId)
            ? SubjectiveReportSubmissionType.BySubjectiveScouter
            : SubjectiveReportSubmissionType.ByNonSubjectiveScouter,
      };

      const update: Partial<Match> = {
        subjectiveReports: [...match.subjectiveReports ?? [], report._id],
      };

      if (match.subjectiveScouter === data.userId)
        update.assignedSubjectiveScouterHasSubmitted = true;

      const insertReportPromise = db.addObject<SubjectiveReport>(CollectionId.SubjectiveReports, report);
      const updateMatchPromise = db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(match._id), update);

      addXp(data.userId, match.subjectiveScouter === data.userId ? 10 : 5);

      await Promise.all([insertReportPromise, updateMatchPromise]);

      return res.status(200).send({ result: "success" });
    },

    getSubjectiveReportsForComp: async (req, res, { db, data }) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));

      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      const matchIds = comp.matches.map((matchId) => new ObjectId(matchId));
      const matches = await db.findObjects<Match>(CollectionId.Matches, {
        _id: { $in: matchIds.map((id) => id.toString()) },
      });

      const reportIds = matches.flatMap((match) => match.subjectiveReports ?? []);
      const reports = await db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        _id: { $in: reportIds },
      });

      return res.status(200).send(reports);
    },

    updateSubjectiveReport: async (req, res, { db, data }) => {
      const report = data.report as SubjectiveReport;
      await db.updateObjectById<SubjectiveReport>(CollectionId.SubjectiveReports, new ObjectId(report._id), report);
      return res.status(200).send({ result: "success" });
    },

    setSubjectiveScouterForMatch: async (req, res, { db, data }) => {
      const { matchId, userId } = data;
      await db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(matchId), {
        subjectiveScouter: userId,
      });
      return res.status(200).send({ result: "success" });
    },

    createPitReportForTeam: async (req, res, { db, data }) => {
      const { teamNumber, compId } = data;

      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId));

      if (!comp)
        return res.status(404).send({ error: "Competition not found" });

      const pitReport = new Pitreport(teamNumber, games[comp.gameId].createPitReportData(), comp.ownerTeam, comp._id);
      const pitReportId = (await db.addObject<Pitreport>(CollectionId.Pitreports, pitReport))._id;

      if (!pitReportId)
        return res.status(500).send({ error: "Failed to create pit report" });

      comp.pitReports.push(pitReportId);

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId), {
        pitReports: comp.pitReports,
      });

      return res.status(200).send({ result: "success" });
    },

    updateCompNameAndTbaId: async (req, res, { db, data }) => {
      const { compId, name, tbaId } = data;

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId), {
        name,
        tbaId,
      });

      return res.status(200).send({ result: "success" });
    },

    getFtcTeamAutofillData: async (req, res, { tba, data }: RouteContents<{ teamNumber: number }>) => {
      const team = await TheOrangeAlliance.getTeam(data.teamNumber);
      return res.status(200).send(team);
    },

    ping: async (req, res, { }) => {
      return res.status(200).send({ result: "success" });
    },

    getSubjectiveReportsFromMatches: async (req, res, { db, data }: RouteContents<{ matches: Match[] }>) => {
      const matchIds = data.matches.map((match) => match._id!.toString());
      const reports = await db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        match: { $in: matchIds },
      });

      return res.status(200).send(reports);
    },

    uploadSavedComp: async (req, res, { db, data }: RouteContents<{ save: SavedCompetition }>) => {
      const { comp, matches, quantReports: reports, pitReports, subjectiveReports } = data.save;

      const promises: Promise<any>[] = [];
      promises.push(db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(comp._id), comp));

      for (const match of Object.values(matches)) {
        promises.push(db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(match._id), match));
      }

      for (const report of Object.values(reports)) {
        promises.push(db.updateObjectById<Report>(CollectionId.Reports, new ObjectId(report._id), report));
      }

      for (const report of Object.values(subjectiveReports)) {
        promises.push(db.updateObjectById<SubjectiveReport>(CollectionId.SubjectiveReports, new ObjectId(report._id), report));
      }

      for (const report of Object.values(pitReports)) {
        promises.push(db.updateObjectById<Pitreport>(CollectionId.Pitreports, new ObjectId(report._id), report));
      }

      await Promise.all(promises);
      return res.status(200).send({ result: "success" });
    },
      
    addSlackBot: async (req, res, { db, data }) => {
      return res.status(200).send({ result: "success" });
    },

    /**
     * REMOVE THIS BEFORE MERGING
     */
    getObjectId: async (req, res, { db, data }: RouteContents<{ _id: ObjectId }>) => {
      console.log("_id:", data._id);
      console.log("_id is ObjectId:", data._id instanceof ObjectId);
      return res.status(200).send({ _id: new ObjectId() });
    }
  }; 
}
