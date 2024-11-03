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
  MatchType,
  Alliance,
} from "./Types";
import { GenerateSlug } from "./Utils";
import { NotLinkedToTba, removeDuplicates } from "./client/ClientUtils";
import { ObjectId } from "mongodb";
import { fillTeamWithFakeUsers } from "./dev/FakeData";
import { AssignScoutersToCompetitionMatches, generateReportsForMatch } from "./CompetitionHandling";
import { WebClient } from "@slack/web-api";
import { getServerSession } from "next-auth";
import Auth, { AuthenticationOptions } from "./Auth";

import { Statbotics } from "./Statbotics";
import { SerializeDatabaseObject } from "./UrlResolver";

import { QuantData, League } from './Types';
import { xpToLevel } from "./Xp";
import { games } from "./games";
import { GameId } from "./client/GameId";
import { TheOrangeAlliance } from "./TheOrangeAlliance";
import ResendUtils from "./ResendUtils";
import { users } from "slack";
import CollectionId from "./client/CollectionId";

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
    res: NextApiResponse,
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

        this.routes[route](req, res, {
          slackClient: this.slackClient,
          db: await this.db,
          tba: this.tba,
          data: req.body,
          userPromise: session.then((s) => s?.user as User | undefined),
        });
      } else {
        new NotFoundError(res, route);
        return;
      }
    }
  }

  async function addXp(userId: string, xp: number) {
    const db = await getDatabase();
    const user = await db.findObjectById<User>(CollectionId.Users, new ObjectId(userId));

    const newXp = user.xp + xp
    const newLevel = xpToLevel(newXp);

    await db.updateObjectById<User>(
      CollectionId.Users,
      new ObjectId(userId),
      { xp: newXp, level: newLevel }
    );
  }

  async function generatePitReports(tba: TheBlueAlliance.Interface, db: MongoDBInterface, tbaId: string, gameId: GameId): Promise<string[]> {
    var pitreports = await tba.getCompetitionPitreports(tbaId, gameId);
    pitreports.map(async (report) => (await db.addObject<Pitreport>(CollectionId.Pitreports, report))._id)

    return pitreports.map((pit) => String(pit._id));
  }

  function onTeam(team?: Team, user?: User) {
    return team && user && user._id && team.users.find((owner) => owner === user._id?.toString()) !== undefined;
  }

  function ownsTeam(team?: Team, user?: User) {
    return team && user && user._id && team.owners.find((owner) => owner === user._id?.toString()) !== undefined;
  }

  function getCompFromReport(db: MongoDBInterface, report: Report) {
    return db.findObject<Competition>(CollectionId.Competitions, {
      matches: report.match?.toString()
    });
  }

  function getCompFromMatch(db: MongoDBInterface, match: Match) {
    return db.findObject<Competition>(CollectionId.Competitions, {
      matches: match._id?.toString()
    });
  }

  function getCompFromPitReport(db: MongoDBInterface, report: Pitreport) {
    return db.findObject<Competition>(CollectionId.Competitions, {
      pitReports: report._id?.toString()
    });
  }

  function getCompFromSubjectiveReport(db: MongoDBInterface, report: SubjectiveReport) {
    return db.findObject<Match>(CollectionId.Matches, {
      subjectiveReports: report._id?.toString()
    }).then(match => {
      if (!match)
        return undefined;

      return getCompFromMatch(db, match);
    });
  }

  function getCompFromPicklist(db: MongoDBInterface, picklist: DbPicklist) {
    return db.findObject<Competition>(CollectionId.Competitions, {
      picklist: picklist._id?.toString()
    });
  }

  function getSeasonFromComp(db: MongoDBInterface, comp: Competition) {
    return db.findObject<Season>(CollectionId.Seasons, {
      competitions: comp?._id?.toString() // Specifying one value is effectively includes for arrays
    });
  }

  function getTeamFromSeason(db: MongoDBInterface, season: Season) {
    return db.findObject<Team>(CollectionId.Teams, {
      seasons: season._id?.toString()
    });
  }

  async function getTeamFromComp(db: MongoDBInterface, comp: Competition) {
    const season = await getSeasonFromComp(db, comp);

    if (!season)
      return undefined;

    return getTeamFromSeason(db, season);
  }

  async function getTeamFromDocument(db: MongoDBInterface, getComp: (db: MongoDBInterface, doc: any) => Promise<any>, doc: any) {
    const comp = await getComp(db, doc);

    if (!comp)
      return undefined;

    return getTeamFromComp(db, comp);
  }

  async function getTeamFromReport(db: MongoDBInterface, report: Report) {
    return getTeamFromDocument(db, getCompFromReport, report);
  }

  async function getTeamFromMatch(db: MongoDBInterface, match: Match) {
    return getTeamFromDocument(db, getCompFromMatch, match);
  }

  async function getTeamFromPitReport(db: MongoDBInterface, report: Pitreport) {
    return getTeamFromDocument(db, getCompFromPitReport, report);
  }

  async function getTeamFromPicklist(db: MongoDBInterface, picklist: DbPicklist) {
    return getTeamFromDocument(db, getCompFromPicklist, picklist);
  }

  async function getTeamFromSubjectiveReport(db: MongoDBInterface, report: SubjectiveReport) {
    return getTeamFromDocument(db, getCompFromSubjectiveReport, report);
  }

  function isDeveloper(email: string | undefined) {
    return (JSON.parse(process.env.DEVELOPER_EMAILS) as string[]).includes(email ?? "");
  }

  export const Routes: RouteCollection = {
    hello: async (req, res, { db, data }) => {
      res.status(200).send({
        message: "howdy there partner",
        db: db ? "connected" : "disconnected",
        data: data,
      });
    },

    /**
     * TODO: Add user verification
     */
    update: async (req, res, { db, data }: RouteContents<{ collection: CollectionId, id: string, newValues: object }>) => {
      const collection = data.collection;
      const id = data.id;
      const newValues = data.newValues;

      res
        .status(200)
        .send(
          await db.updateObjectById(collection, new ObjectId(id), newValues)
        );
    },
    
    /**
     * TODO: Add user verification
     */
    find: async (req, res, { db, data }: RouteContents<{ collection: CollectionId, query: { _id?: string | ObjectId } }>) => {
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

    // modification

    requestToJoinTeam: async (req, res, { db, data }) => {
      // {
      //     teamId
      //     userId
      // }

      let team = await db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId)
      );

      team.requests = removeDuplicates([...team.requests, data.userId]);

      await db.updateObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId),
        team
      )

      return res.status(200).send({ result: "success" });
    },

    handleRequest: async (req, res, { db, data, userPromise }: RouteContents<{ accept: boolean, userId: string, teamId: string }>) => {
      const teamPromise = db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId)
      );
      
      const joineePromise = db.findObjectById<User>(
        CollectionId.Users,
        new ObjectId(data.userId)
      );

      const userOnTeam = await userPromise;
      const team = await teamPromise;
      
      if (!ownsTeam(team, userOnTeam)) {
        return res.status(403).send({ error: "You do not own this team" });
      }

      const joinee = await joineePromise;

      team.requests.splice(team.requests.indexOf(data.userId), 1);

      if (data.accept) {
        team.users = removeDuplicates(...team.users, data.userId);
        team.scouters = removeDuplicates(...team.scouters, data.userId);

        joinee.teams = removeDuplicates(...joinee.teams, data.teamId);
      }

      await Promise.all([
        db.updateObjectById<User>(
          CollectionId.Users,
          new ObjectId(data.userId),
          joinee
        ),
        db.updateObjectById<Team>(
          CollectionId.Teams,
          new ObjectId(data.teamId),
          team
        )
      ]);

      return res.status(200).send(team);
    },

    // tba shit

    teamAutofill: async (req, res, { tba, data }: RouteContents<{ number: number, league: League }>) => {
      return res.status(200).send(data.league === League.FTC 
        ? await TheOrangeAlliance.getTeam(data.number)
        : await tba.getTeamAutofillData(data.number)
      );
    },

    competitionAutofill: async (req, res, { tba, data }: RouteContents<{ tbaId: string }>) => {
      return res
        .status(200)
        .send(await tba.getCompetitionAutofillData(data.tbaId));
    },

    competitionMatches: async (req, res, { tba, data }: RouteContents<{ tbaId: string }>) => {
      return res.status(200).send(await tba.getCompetitionMatches(data.tbaId));
    },

    matchAutofill: async (req, res, { tba, data }: RouteContents<{ tbaId: string }>) => {
      return res.status(200).send(await tba.getMatchAutofillData(data.tbaId));
    },

    // creation
    createTeam: async (req, res, { db, userPromise: userPromise, data }: RouteContents<{ name: string, tbaId: string, number: number, league: League }>) => {
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
        [user._id.toString()],
        [user._id.toString()],
        [user._id.toString()]
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
        fillTeamWithFakeUsers(20, team._id);
      }

      return res.status(200).send(team);
    },

    // NEEDS TO BE ADDED TO TEAM DUMBASS
    createSeason: async (req, res, { db, data, userPromise }: RouteContents<{ year: number, name: string, teamId: string, gameId: GameId }>) => {
      const team = await db.findObjectById<Team>(
        CollectionId.Teams,
        new ObjectId(data.teamId)
      );

      if (!ownsTeam(team, (await userPromise))) {
        return res.status(403).send({ error: "Unauthorized" });
      }

      const season = await db.addObject<Season>(
        CollectionId.Seasons,
        new Season(
          data.name,
          await GenerateSlug(CollectionId.Seasons, data.name),
          data.year,
          data.gameId
        )
      );
      team.seasons = [...team.seasons, String(season._id)];

      await db.updateObjectById(
        CollectionId.Teams,
        new ObjectId(data.teamId),
        team
      );

      return res.status(200).send(season);
    },

    reloadCompetition: async (req, res, { db, data, tba, userPromise }: RouteContents<{ compId: string }>) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));
      const team = await getTeamFromComp(db, comp);

      if (!ownsTeam(team, await userPromise)) {
        return res.status(403).send({ error: "Unauthorized" });
      }

      if (!comp.tbaId) {
        return res.status(200).send({ result: "none" });
      }

      const matches = await tba.getCompetitionMatches(comp.tbaId);
      if (!matches || matches.length <= 0) {
        res.status(200).send({ result: "none" });
        return;
      }

      matches.map(
        async (match) =>
          (await db.addObject<Match>(CollectionId.Matches, match))._id
      );

      const pitReports = await generatePitReports(tba, db, comp.tbaId, comp.gameId);

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

    createCompetiton: async (req, res, { db, data, tba, userPromise }: 
        RouteContents<{ tbaId: string, start: number, end: number, name: string, seasonId: string, publicData: boolean }>) => {      
      const season = await db.findObjectById<Season>(CollectionId.Seasons, new ObjectId(data.seasonId));
      const team = await getTeamFromSeason(db, season);

      if (!ownsTeam(team, await userPromise)) {
        return res.status(403).send({ error: "Unauthorized" });
      }

      const matches = await tba.getCompetitionMatches(data.tbaId);
      matches.map(
        async (match) =>
          (await db.addObject<Match>(CollectionId.Matches, match))._id,
      );
      
      const pitReports = await generatePitReports(tba, db, data.tbaId, season.gameId);

      const picklist = await db.addObject<DbPicklist>(CollectionId.Picklists, {
        _id: new ObjectId(),
        picklists: {},
      });

      const comp = await db.addObject<Competition>(
        CollectionId.Competitions,
        new Competition(
          data.name,
          await GenerateSlug(CollectionId.Competitions, data.name),
          data.tbaId,
          data.start,
          data.end,
          pitReports,
          matches.map((match) => String(match._id)),
          picklist._id.toString(),
          data.publicData,
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
        generateReportsForMatch(match, comp.gameId)
      );
      await Promise.all(reportCreationPromises);

      return res.status(200).send(comp);
    },

    regeneratePitReports: async (req, res, { db, data, tba, userPromise }) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));

      if (!comp.tbaId)
        return res.status(200).send({ error: "not linked to TBA" });

      const team = await getTeamFromComp(db, comp);
      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const pitReports = await generatePitReports(tba, db, comp.tbaId, comp.gameId);

      await db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(data.compId),
        { pitReports: pitReports }
      );

      return res.status(200).send({ result: "success", pitReports });
    },

    createMatch: async (req, res, { db, data, userPromise }: 
        RouteContents<{ tbaId?: string, number: number, time: number, type: MatchType, redAlliance: Alliance, blueAlliance: Alliance, compId: string }>) => {
      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      const team = await getTeamFromComp(db, comp);
      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const match = await db.addObject<Match>(
        CollectionId.Matches,
        new Match(
          data.number,
          await GenerateSlug(CollectionId.Matches, data.number.toString()),
          data.tbaId,
          data.time,
          data.type,
          data.blueAlliance,
          data.redAlliance
        )
      );
      comp.matches.push(match._id ? String(match._id) : "");

      const reportPromise = generateReportsForMatch(match, comp.gameId);

      await Promise.all([db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(comp._id),
        comp
      ), reportPromise]);

      return res.status(200).send(match);
    },

    searchCompetitionByName: async (req, res, { tba, data }: RouteContents<{ name: string}>) => {
      return res.status(200).send(await tba.searchCompetitionByName(data.name));
    },

    assignScouters: async (req, res, { data, db, userPromise }: RouteContents<{ compId: string, shuffle: boolean }>) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));

      const team = await getTeamFromComp(db, comp);
      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      if (!team?._id)
        return res.status(400).send({ error: "Team not found" });

      const result = await AssignScoutersToCompetitionMatches(
        team?._id?.toString(),
        data.compId,
      );

      console.log(result);
      return res.status(200).send({ result: result });
    },

    submitForm: async (req, res, { db, data, userPromise }: RouteContents<{ reportId: string, formData: QuantData }>) => {
      const form = await db.findObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(data.reportId)
      );

      const team = await getTeamFromReport(db, form);
      const user = await userPromise;
      if (!onTeam(team, user) || !user?._id)
        return res.status(403).send({ error: "Unauthorized" });
      
      form.data = data.formData;
      form.submitted = true;
      form.submitter = user._id.toString();

      await db.updateObjectById(
        CollectionId.Reports,
        new ObjectId(data.reportId),
        form
      );

      addXp(user._id.toString(), 10);

      await db.updateObjectById(
        CollectionId.Users,
        new ObjectId(user._id.toString()),
        user
      );
      return res.status(200).send({ result: "success" });
    },

    competitionReports: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string, submitted: boolean, usePublicData: boolean }>) => {
      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      const team = await getTeamFromComp(db, comp);
      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

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

    allCompetitionMatches: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string }>) => {
      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      const team = await getTeamFromComp(db, comp);
      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const matches = await db.findObjects<Match[]>(CollectionId.Matches, {
        _id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
      });
      return res.status(200).send(matches);
    },

    matchReports: async (req, res, { db, data, userPromise }: RouteContents<{ matchId: string }>) => {
      const match = await db.findObjectById<Match>(
        CollectionId.Matches,
        new ObjectId(data.matchId)
      );

      const team = await getTeamFromMatch(db, match);
      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const reports = await db.findObjects<Report[]>(CollectionId.Reports, {
        _id: { $in: match.reports.map((reportId) => new ObjectId(reportId)) },
      });
      return res.status(200).send(reports);
    },

    changePFP: async (req, res, { db, data, userPromise }: RouteContents<{ newImage: string }>) => {
      const user = await userPromise;

      if (!user?._id)
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<User>(
        CollectionId.Users,
        new ObjectId(user._id),
        { image: data.newImage }
      );

      return res.status(200).send({ result: "success" });
    },

    checkInForReport: async (req, res, { db, data, userPromise }: RouteContents<{ reportId: string }>) => {
      const report = await db.findObjectById<Report>(CollectionId.Reports, new ObjectId(data.reportId));
      const team = await getTeamFromReport(db, report);

      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(data.reportId),
        { checkInTimestamp: new Date().toISOString() }
      );

      return res.status(200).send({ result: "success" });
    },

    checkInForSubjectiveReport: async (req, res, { db, data, userPromise }: RouteContents<{ matchId: string }>) => {
      const match = await db.findObjectById<Match>(CollectionId.Matches, new ObjectId(data.matchId));
      const team = await getTeamFromMatch(db, match);
      const user = await userPromise;

      if (!onTeam(team, user))
        return res.status(403).send({ error: "Unauthorized" });

      const update: { [key: string]: any } = {};
      update[`subjectiveReportsCheckInTimestamps.${user?._id?.toString()}`] = new Date().toISOString();
      await db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(data.matchId), update);

      return res.status(200).send({ result: "success" });
    },

    remindSlack: async (req, res, { db, slackClient, data, userPromise }: RouteContents<{ teamId: string, slackId: string }>) => {
      const team = await db.findObjectById<Team>(CollectionId.Teams, new ObjectId(data.teamId));
      const user = await userPromise;

      if (!onTeam(team, user))
        return res.status(403).send({ error: "Unauthorized" });

      if (!team.slackChannel)
        return res.status(200).send({ error: "Team has not linked their Slack channel" });

      const msgRes = await slackClient.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: team.slackChannel,
        text: `<@${data.slackId}>, please report to our section and prepare for scouting. Sent by <@${user?.slackId}>`,
      });

      return res.status(200).send({ result: "success", msgRes });
    },

    setSlackId: async (req, res, { db, data, userPromise }: RouteContents<{ slackId: string }>) => {
      const user = await userPromise;

      if (!user?._id)
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<User>(
        CollectionId.Users,
        new ObjectId(user._id),
        { slackId: data.slackId }
      );
    },

    initialEventData: async (req, res, { tba, data }: RouteContents<{ eventKey: string }>) => {
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

    compRankings: async (req, res, { tba, data }: RouteContents<{ tbaId: string }>) => {
      const compRankings = await tba.req.getCompetitonRanking(data.tbaId);
      return res.status(200).send(compRankings.rankings);
    },

    statboticsTeamEvent: async (req, res, { data }: RouteContents<{ eventKey: string, team: number| string }>) => {
      const teamEvent = await Statbotics.getTeamEvent(data.eventKey, data.team);
      return res.status(200).send(teamEvent);
    },

    getMainPageCounterData: async (req, res, { db }) => {
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

    exportCompAsCsv: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string }>) => {
      // Get all the reports for the competition
      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      const team = await getTeamFromComp(db, comp);
      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const matches = await db.findObjects<Match>(CollectionId.Matches, {
        _id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
      });
      const allReports = await db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: matches.map((match) => match?._id?.toString()) },
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

    teamCompRanking: async (req, res, { tba, data }: RouteContents<{ tbaId: string, team: string }>) => {
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

    getPitReports: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string }>) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));
      const team = await getTeamFromComp(db, comp);

      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const pitReports = await db.findObjects<Pitreport>(CollectionId.Pitreports, {
        _id: { $in: comp.pitReports.map((id) => new ObjectId(id)) },
      });

      return res.status(200).send(pitReports);
    },

    changeScouterForReport: async (req, res, { db, data, userPromise }: RouteContents<{ reportId: string, scouterId: string }>) => {
      const report = await db.findObjectById<Report>(CollectionId.Reports, new ObjectId(data.reportId));
      const team = await getTeamFromReport(db, report);

      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(data.reportId),
        { user: data.scouterId }
      );

      return res.status(200).send({ result: "success" });
    },
  
    getCompReports: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string }>) => {
      const comp = await db.findObjectById<Competition>(
        CollectionId.Competitions,
        new ObjectId(data.compId)
      );

      const team = await getTeamFromComp(db, comp);
      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const reports = await db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: comp.matches },
      });

      return res.status(200).send(reports);
    },

    findScouterManagementData: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string }>) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));
      const team = await getTeamFromComp(db, comp);

      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      if (!team?._id)
        return res.status(400).send({ error: "Team not found" });

      const promises: Promise<any>[] = [];

      const scouters: User[] = [];
      const matches: Match[] = [];
      const quantitativeReports: Report[] = [];
      const pitReports: Pitreport[] = [];
      const subjectiveReports: SubjectiveReport[] = [];

      for (const scouterId of team?.scouters) {
        promises.push(db.findObjectById<User>(CollectionId.Users, new ObjectId(scouterId)).then((scouter) => scouters.push(scouter)));
      }

      for (const matchId of comp.matches) {
        promises.push(db.findObjectById<Match>(CollectionId.Matches, new ObjectId(matchId)).then((match) => matches.push(match)));
      }

      promises.push(db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: comp.matches },
      }).then((r) => quantitativeReports.push(...r)));

      promises.push(db.findObjects<Pitreport>(CollectionId.Pitreports, {
        _id: { $in: comp.pitReports.map((id) => new ObjectId(id)) },
        submitted: true
      }).then((r) => pitReports.push(...r)));

      promises.push(db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        match: { $in: comp.matches }
      }).then((r) => subjectiveReports.push(...r)));

      await Promise.all(promises);

      return res.status(200).send({ scouters, matches, quantitativeReports, pitReports, subjectiveReports });
    },

    getPicklist: async (req, res, { db, data, userPromise }: RouteContents<{ id: string }>) => {
      const picklist = await db.findObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(data.id));

      const team = await getTeamFromPicklist(db, picklist);
      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      return res.status(200).send(picklist);
    },

    updatePicklist: async (req, res, { db, data, userPromise }: RouteContents<{ picklist: DbPicklist }>) => {
      const existingPicklist = await db.findObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(data.picklist._id));
      const team = await getTeamFromPicklist(db, existingPicklist);

      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const { _id, ...picklist } = data.picklist;
      await db.updateObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(data.picklist._id), picklist);
      return res.status(200).send({ result: "success" });
    },

    setCompPublicData: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string, publicData: boolean }>) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));
      const team = await getTeamFromComp(db, comp);
      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId), { publicData: data.publicData });
      return res.status(200).send({ result: "success" });
    },
  
    setOnboardingCompleted: async (req, res, { db, data, userPromise }: RouteContents<{userId: string}>) => {
      const user = await userPromise;
      if (!user?._id)
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<User>(CollectionId.Users, new ObjectId(user._id), { onboardingComplete: true });
      return res.status(200).send({ result: "success" });
    },
    
    submitSubjectiveReport: async (req, res, { db, data, userPromise }: RouteContents<{ report: SubjectiveReport, match: string }>) => {
      const rawReport = data.report as SubjectiveReport;

      const match = await db.findObjectById<Match>(CollectionId.Matches, new ObjectId(rawReport.match));
      const team = await getTeamFromMatch(db, match);
      const user = await userPromise;

      if (!onTeam(team, user))
        return res.status(403).send({ error: "Unauthorized" });

      const report: SubjectiveReport = {
        ...data.report,
        _id: new ObjectId().toString(),
        submitter: user!._id!.toString(),
        submitted: match.subjectiveScouter === user!._id!.toString()
          ? SubjectiveReportSubmissionType.ByAssignedScouter
          : team!.subjectiveScouters.find(id => id === user!._id!.toString())
            ? SubjectiveReportSubmissionType.BySubjectiveScouter
            : SubjectiveReportSubmissionType.ByNonSubjectiveScouter,
      };

      const update: Partial<Match> = {
        subjectiveReports: [...match.subjectiveReports ?? [], report._id!.toString()],
      };

      if (match.subjectiveScouter === user!._id!.toString())
        update.assignedSubjectiveScouterHasSubmitted = true;

      const insertReportPromise = db.addObject<SubjectiveReport>(CollectionId.SubjectiveReports, report);
      const updateMatchPromise = db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(match._id), update);

      addXp(user!._id!, match.subjectiveScouter === user!._id!.toString() ? 10 : 5);

      await Promise.all([insertReportPromise, updateMatchPromise]);
      return res.status(200).send({ result: "success" });
    },

    getSubjectiveReportsForComp: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string }>) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));
      const team = await getTeamFromComp(db, comp);

      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });
      
      const reports = await db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        match: { $in: comp.matches },
      });

      return res.status(200).send(reports);
    },

    updateSubjectiveReport: async (req, res, { db, data, userPromise }: RouteContents<{ report: SubjectiveReport }>) => {
      const report = data.report as SubjectiveReport;
      const team = await getTeamFromSubjectiveReport(db, report);

      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<SubjectiveReport>(CollectionId.SubjectiveReports, new ObjectId(report._id), report);
      return res.status(200).send({ result: "success" });
    },

    setSubjectiveScouterForMatch: async (req, res, { db, data, userPromise }: RouteContents<{ matchId: string }>) => {
      const match = await db.findObjectById<Match>(CollectionId.Matches, new ObjectId(data.matchId));
      const team = await getTeamFromMatch(db, match);
      const user = await userPromise;

      if (!ownsTeam(team, user))
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(data.matchId), {
        subjectiveScouter: user!._id?.toString(),
      });
      return res.status(200).send({ result: "success" });
    },

    createPitReportForTeam: async (req, res, { db, data, userPromise }: RouteContents<{ teamNumber: number, compId: string }>) => {
      const { teamNumber, compId } = data;

      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId));
      const team = await getTeamFromComp(db, comp);

      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const pitReport = new Pitreport(teamNumber, games[comp.gameId].createPitReportData());
      const pitReportId = (await db.addObject<Pitreport>(CollectionId.Pitreports, pitReport))._id?.toString();

      if (!pitReportId)
        return res.status(500).send({ error: "Failed to create pit report" });

      comp.pitReports.push(pitReportId);

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId), {
        pitReports: comp.pitReports,
      });

      return res.status(200).send({ result: "success" });
    },

    updateCompNameAndTbaId: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string, name: string, tbaId: string }>) => {
      const { compId, name, tbaId } = data;

      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId));
      const team = await getTeamFromComp(db, comp);

      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId), {
        name,
        tbaId,
      });

      return res.status(200).send({ result: "success" });
    },

    getFtcTeamAutofillData: async (req, res, { data }: RouteContents<{ teamNumber: number }>) => {
      const team = await TheOrangeAlliance.getTeam(data.teamNumber);
      return res.status(200).send(team);
    },

    ping: async (req, res, { }) => {
      return res.status(200).send({ result: "success" });
    },

    getSubjectiveReportsFromMatches: async (req, res, { db, data, userPromise }: RouteContents<{ compId: string, matches: Match[] }>) => {
      const comp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(data.compId));
      const team = await getTeamFromComp(db, comp);

      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      // Reject if any of the matches are not in the competition
      for (const match of data.matches) {
        if (!comp.matches.find(id => id === match._id?.toString()))
          return res.status(400).send({ error: "Match not in competition" });
      }

      const matchIds = data.matches.map((match) => match._id?.toString());
      const reports = await db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        match: { $in: matchIds },
      });

      return res.status(200).send(reports);
    },

    uploadSavedComp: async (req, res, { db, data, userPromise }: RouteContents<{ save: SavedCompetition }>) => {
      const { comp, matches, quantReports: reports, pitReports, subjectiveReports } = data.save;

      const existingComp = await db.findObjectById<Competition>(CollectionId.Competitions, new ObjectId(comp._id));
      const team = await getTeamFromComp(db, existingComp);

      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

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

    removeUserFromTeam: async (req, res, { db, data, userPromise }: RouteContents<{ teamId: string, userId: string }>) => {
      const team = await db.findObjectById<Team>(CollectionId.Teams, new ObjectId(data.teamId));

      if (!ownsTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      const removedUserPromise = db.findObjectById<User>(CollectionId.Users, new ObjectId(data.userId));

      const newTeam: Team = {
        ...team,
        users: team.users.filter((id) => id !== data.userId),
        owners: team.owners.filter((id) => id !== data.userId),
        scouters: team.scouters.filter((id) => id !== data.userId),
        subjectiveScouters: team.subjectiveScouters.filter((id) => id !== data.userId),
      }
      
      const teamPromise = db.updateObjectById<Team>(CollectionId.Teams, new ObjectId(data.teamId), newTeam);

      const removedUser = await removedUserPromise;
      if (!removedUser)
        return res.status(404).send({ error: "User not found" });

      const newUserData: User = {
        ...removedUser,
        teams: removedUser.teams.filter((id) => id !== data.teamId),
        owner: removedUser.owner.filter((id) => id !== data.teamId),
      }

      await db.updateObjectById<User>(CollectionId.Users, new ObjectId(data.userId), newUserData);
      await teamPromise;

      return res.status(200).send({ result: "success", team: newTeam });
    },

    speedTest: async (req, res, { db, data, userPromise }: RouteContents<{ requestTimestamp: number }>) => {
      const authStart = Date.now();
      const user = await userPromise;
      if (!user || !isDeveloper(user.email))
        return res.status(403).send({ error: "Unauthorized" });

      const resObj = {
        requestTime: Math.max(Date.now() - data.requestTimestamp, 0),
        authTime: Date.now() - authStart,
        insertTime: 0,
        findTime: 0,
        updateTime: 0,
        deleteTime: 0,
        responseTimestamp: Date.now(),
      }

      const testObject = {
        _id: new ObjectId(),
      }
      const insertStart = Date.now();
      await db.addObject(CollectionId.Misc, testObject);
      resObj.insertTime = Date.now() - insertStart;

      const findStart = Date.now();
      await db.findObjectById(CollectionId.Misc, testObject._id);
      resObj.findTime = Date.now() - findStart;

      const updateStart = Date.now();
      await db.updateObjectById(CollectionId.Misc, testObject._id, {name: "test"});
      resObj.updateTime = Date.now() - updateStart;

      const deleteStart = Date.now();
      await db.deleteObjectById(CollectionId.Misc, testObject._id);
      resObj.deleteTime = Date.now() - deleteStart;

      resObj.responseTimestamp = Date.now();
      return res.status(200).send(resObj);
    }
  }; 
}
