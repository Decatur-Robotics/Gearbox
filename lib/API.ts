import { NextApiRequest, NextApiResponse } from "next";
import { Collections, GetDatabase, MongoDBInterface } from "./MongoDB";
import { TheBlueAlliance } from "./TheBlueAlliance";
import {
  Competition,
  Form,
  Match,
  Season,
  Team,
  User,
  Report,
  Pitreport,
} from "./Types";
import { GenerateSlug } from "./Utils";
import { ObjectId } from "mongodb";
import { fillTeamWithFakeUsers } from "./dev/FakeData";
import { AssignScoutersToCompetitionMatches } from "./CompetitionHandeling";
import { WebClient } from "@slack/web-api";
import { getServerSession } from "next-auth";
import Auth, { AuthenticationOptions } from "./Auth";

import { Statbotics } from "./Statbotics";
import { SerializeDatabaseObject } from "./UrlResolver";

import { FormData } from "./Types";

export namespace API {
  export const GearboxHeader = "gearbox-auth";
  type Route = (
    req: NextApiRequest,
    res: NextApiResponse,
    contents: {
      slackClient: WebClient;
      db: MongoDBInterface;
      tba: TheBlueAlliance.Interface;
      data: any;
    }
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

  export class Handler {
    // feed routes as big object to the handler
    routes: RouteCollection;
    db: Promise<MongoDBInterface>;
    tba: TheBlueAlliance.Interface;
    slackClient: WebClient;
    basePath: string;

    constructor(apiRoutes: RouteCollection, base = "/api/") {
      this.routes = apiRoutes;
      this.db = GetDatabase();
      this.tba = new TheBlueAlliance.Interface();
      this.basePath = base;
      this.slackClient = new WebClient(process.env.FUCK_YOU_FASCIST_ASSHOLES);
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
        const session = await getServerSession(req, res, AuthenticationOptions);

        if (
          req.headers[GearboxHeader]?.toString() !== process.env.API_KEY ||
          !session
        ) {
          new UnauthorizedError(res);
        }
      }

      var route = req.url.replace(this.basePath, "");

      if (route in this.routes) {
        this.routes[route](req, res, {
          slackClient: this.slackClient,
          db: await this.db,
          tba: this.tba,
          data: req.body,
        });
      } else {
        new NotFoundError(res, route);
        return;
      }
    }
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

    update: async (req, res, { db, data }) => {
      // {
      //     collection,
      //      id,
      //     newValues,
      // }
      const collection = data.collection;
      const id = data.id;
      const newValues = data.newValues;

      res
        .status(200)
        .send(
          await db.updateObjectById(collection, new ObjectId(id), newValues)
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

    find: async (req, res, { db, data }) => {
      // {
      //     collection,
      //     query
      // }
      const collection = data.collection;
      var query = data.query;

      if (query._id) {
        query._id = new ObjectId(query._id);
      }

      let obj = await db.findObject(collection, query);
      if (!obj) {
        obj = {};
      }

      res.status(200).send(obj);
    },

    findAll: async (req, res, { db, data }) => {
      // {
      //     collection,

      // }
      const collection = data.collection;

      res.status(200).send(await db.findObjects(collection, {}));
    },

    // modification

    teamRequest: async (req, res, { db, data }) => {
      // {
      //     teamId
      //     userId
      // }

      let team = await db.findObjectById<Team>(
        Collections.Teams,
        new ObjectId(data.teamId)
      );
      team.requests = [...team.requests, data.userId];

      return res
        .status(200)
        .send(
          await db.updateObjectById<Team>(
            Collections.Teams,
            new ObjectId(data.teamId),
            team
          )
        );
    },

    handleRequest: async (req, res, { db, data }) => {
      // {
      //     accept
      //     userId
      //     teamId
      // }

      let team = await db.findObjectById<Team>(
        Collections.Teams,
        new ObjectId(data.teamId)
      );
      let user = await db.findObjectById<User>(
        Collections.Users,
        new ObjectId(data.userId)
      );

      team.requests.splice(team.requests.indexOf(data.userId), 1);

      if (data.accept) {
        team.users.push(data.userId);
        team.scouters.push(data.userId);

        user.teams.push(data.teamId);
      }

      await db.updateObjectById<User>(
        Collections.Users,
        new ObjectId(data.userId),
        user
      );
      await db.updateObjectById<Team>(
        Collections.Teams,
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
      return res.status(200).send(await tba.getTeamAutofillData(data.number));
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
    createTeam: async (req, res, { db, data }) => {
      // {
      //     number
      //     tbaId?
      //     name,
      //     creator
      // }
      const newTeamObj = new Team(
        data.name,
        await GenerateSlug(Collections.Teams, data.name),
        data?.tbaId,
        data.number,
        [data.creator],
        [data.creator],
        [data.creator]
      );
      const team = await db.addObject<Team>(Collections.Teams, newTeamObj);

      var user = await db.findObjectById<User>(
        Collections.Users,
        new ObjectId(data.creator)
      );
      user.teams.push(team._id!.toString());
      user.owner.push(team._id!.toString());

      await db.updateObjectById(
        Collections.Users,
        new ObjectId(user._id),
        user
      );

      if (process.env.FILL_TEAMS === "true") {
        fillTeamWithFakeUsers(20, team._id);
      }

      return res.status(200).send(team);
    },

    // NEEDS TO BE ADDED TO TEAM DUMBASS
    createSeason: async (req, res, { db, data }) => {
      // {
      //     year
      //     name
      //     teamId;
      // }
      var season = await db.addObject<Season>(
        Collections.Seasons,
        new Season(
          data.name,
          await GenerateSlug(Collections.Seasons, data.name),
          data.year
        )
      );
      var team = await db.findObjectById<Team>(
        Collections.Teams,
        new ObjectId(data.teamId)
      );
      team.seasons = [...team.seasons, String(season._id)];

      await db.updateObjectById(
        Collections.Teams,
        new ObjectId(data.teamId),
        team
      );

      return res.status(200).send(season);
    },

    updateCompetition: async (req, res, { db, data, tba }) => {
      // {comp id, tbaId}
      var matches = await tba.getCompetitionMatches(data.tbaId);
      if (!matches || matches.length <= 0) {
        res.status(200).send({ result: "none" });
        return;
      }

      matches.map(
        async (match) =>
          (await db.addObject<Match>(Collections.Matches, match))._id
      );

      var pitreports = await tba.getCompetitionPitreports(data.tbaId);
      pitreports.map(
        async (report) =>
          (await db.addObject<Pitreport>(Collections.Pitreports, report))._id
      );

      await db.updateObjectById(
        Collections.Competitions,
        new ObjectId(data.compId),
        {
          matches: matches.map((match) => String(match._id)),
          pitReports: pitreports.map((pit) => String(pit._id)),
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
      // }
      /*
      var matches = await tba.getCompetitionMatches(data.tbaId);
      matches.map(
        async (match) =>
          (await db.addObject<Match>(Collections.Matches, match))._id,
      );

      var pitreports = await tba.getCompetitionPitreports(data.tbaId);
      pitreports.map(async (report) => (await db.addObject<Pitreport>(Collections.Pitreports, report))._id)
      */

      var comp = await db.addObject<Competition>(
        Collections.Competitions,
        new Competition(
          data.name,
          await GenerateSlug(Collections.Competitions, data.name),
          data.tbaId,
          data.start,
          data.end
          //pitreports.map((report) => String(report._id)),
          //matches.map((match) => String(match._id)),
        )
      );

      var season = await db.findObjectById<Season>(
        Collections.Seasons,
        new ObjectId(data.seasonId)
      );
      season.competitions = [...season.competitions, String(comp._id)];

      await db.updateObjectById(
        Collections.Seasons,
        new ObjectId(season._id),
        season
      );

      return res.status(200).send(comp);
    },

    createMatch: async (req, res, { db, data }) => {
      // {
      //     tbaId?
      //     number
      //     time
      //     type
      // }
      var match = await db.addObject<Match>(
        Collections.Matches,
        new Match(
          data.number,
          await GenerateSlug(Collections.Matches, data.number.toString()),
          data.tbaId,
          data.time,
          data.type,
          data.redAlliance,
          data.blueAlliance
        )
      );
      var comp = await db.findObjectById<Competition>(
        Collections.Competitions,
        new ObjectId(data.compId)
      );
      comp.matches.push(match._id ? String(match._id) : "");
      await db.updateObjectById(
        Collections.Competitions,
        new ObjectId(comp._id),
        comp
      );

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
      return res.status(200).send({ result: result });
    },

    submitForm: async (req, res, { db, data }) => {
      // {
      //    reportId
      //    formData
      // }

      var form = await db.findObjectById<Report>(
        Collections.Reports,
        new ObjectId(data.reportId)
      );
      form.data = data.formData;
      form.submitted = true;
      form.checkedIn = false;
      await db.updateObjectById(
        Collections.Reports,
        new ObjectId(data.reportId),
        form
      );
      let user = await db.findObjectById<User>(
        Collections.Users,
        new ObjectId(data.userId)
      );
      user.xp = user.xp + Math.round(Math.random() * 10);
      if (user.xp > user.level * 100) {
        user.level = Math.ceil((user.xp + 1) / 100);
      }
      await db.updateObjectById(
        Collections.Users,
        new ObjectId(data.userId),
        user
      );
      return res.status(200).send({ result: "success" });
    },

    competitionReports: async (req, res, { db, data }) => {
      // {
      // compId
      // submitted
      // }

      const comp = await db.findObjectById<Competition>(
        Collections.Competitions,
        new ObjectId(data.compId)
      );
      const reports = await db.findObjects<Report[]>(Collections.Reports, {
        match: { $in: comp.matches },
        submitted: data.submitted ? true : { $exists: true },
      });
      return res.status(200).send(reports);
    },

    allCompetitionMatches: async (req, res, { db, data }) => {
      // {
      // compId
      // }

      const comp = await db.findObjectById<Competition>(
        Collections.Competitions,
        new ObjectId(data.compId)
      );
      const matches = await db.findObjects<Match[]>(Collections.Matches, {
        _id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
      });
      return res.status(200).send(matches);
    },

    matchReports: async (req, res, { db, data }) => {
      // {
      // compId
      // }

      const match = await db.findObjectById<Match>(
        Collections.Matches,
        new ObjectId(data.matchId)
      );
      const reports = await db.findObjects<Report[]>(Collections.Reports, {
        _id: { $in: match.reports.map((reportId) => new ObjectId(reportId)) },
      });
      return res.status(200).send(reports);
    },

    changePFP: async (req, res, { db, data }) => {
      await db.updateObjectById<User>(
        Collections.Users,
        new ObjectId(data.userId),
        { image: `${data.newImage}` }
      );
    },

    updateCheckIn: async (req, res, { db, data }) => {
      await db.updateObjectById<Report>(
        Collections.Reports,
        new ObjectId(data.reportId),
        { checkedIn: true }
      );
    },

    updateCheckOut: async (req, res, { db, data }) => {
      await db.updateObjectById<Report>(
        Collections.Reports,
        new ObjectId(data.reportId),
        { checkedIn: false }
      );
    },

    remindSlack: async (req, res, { slackClient, data }) => {
      await slackClient.chat.postMessage({
        token: process.env.SLACK_KEY,
        channel: process.env.SLACK_CHANNEL,
        text: `<@${data.slackId}> Please report to our section and prepare for scouting. Sent by @${data.senderSlackId}`,
      });
    },

    setSlackId: async (req, res, { db, data }) => {
      await db.updateObjectById<User>(
        Collections.Users,
        new ObjectId(data.userId),
        { slackId: data.slackId }
      );
    },

    setOwebucks: async (req, res, { db, data }) => {
      await db.updateObjectById<User>(
        Collections.Users,
        new ObjectId(data.userId),
        { xp: data.oweBucks + data.oweBucksToAdd }
      );
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

    statboticsTeamEvent: async (req, res, { data }) => {
      const teamEvent = await Statbotics.getTeamEvent(data.eventKey, data.team);
      return res.status(200).send(teamEvent);
    },

    getMainPageCounterData: async (req, res, { db, data }) => {
      const teamsPromise = db.countObjects(Collections.Teams, {});
      const usersPromise = db.countObjects(Collections.Users, {});
      const reportsPromise = db.countObjects(Collections.Reports, {});
      const competitionsPromise = db.countObjects(Collections.Competitions, {});

      const dataPointsPerReport = Reflect.ownKeys(FormData).length;

      await Promise.all([teamsPromise, usersPromise, reportsPromise]);

      return res.status(200).send({
        teams: await teamsPromise,
        users: await usersPromise,
        datapoints: ((await reportsPromise) ?? 0) * dataPointsPerReport,
        competitions: await competitionsPromise,
      });
    },

    exportCompAsCsv: async (req, res, { db, data }) => {
      // Get all the reports for the competition
      const comp = await db.findObjectById<Competition>(
        Collections.Competitions,
        new ObjectId(data.compId)
      );
      const matches = await db.findObjects<Match>(Collections.Matches, {
        _id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
      });
      const allReports = await db.findObjects<Report>(Collections.Reports, {
        match: { $in: matches.map((match) => match?._id?.toString()) },
      });
      const reports = allReports.filter((report) => report.submitted);

      if (reports.length == 0) {
        return res
          .status(200)
          .send({ error: "No reports found for competition" });
      }

      // Convert reports to row data
      interface Row extends FormData {
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
  };
}
