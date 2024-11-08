import { ObjectId } from "bson";
import CollectionId from "../client/CollectionId";
import AccessLevels from "./AccessLevels";
import ApiDependencies from "./ApiDependencies";
import ApiLib from './ApiLib';
import { Alliance, Competition, CompetitonNameIdPair, DbPicklist, League, Match, MatchType, Pitreport, QuantData, Season, SubjectiveReport, SubjectiveReportSubmissionType, Team, User, Report, SavedCompetition } from "@/lib/Types";
import { NotLinkedToTba, removeDuplicates } from "../client/ClientUtils";
import { addXp, generatePitReports, getTeamFromMatch, getTeamFromReport, onTeam, ownsTeam } from "./ApiUtils";
import { TheOrangeAlliance } from "../TheOrangeAlliance";
import { GenerateSlug } from "../Utils";
import { fillTeamWithFakeUsers } from "../dev/FakeData";
import { GameId } from "../client/GameId";
import { AssignScoutersToCompetitionMatches, generateReportsForMatch } from "../CompetitionHandling";
import { games } from "../games";
import { Statbotics } from "../Statbotics";
import { TheBlueAlliance } from "../TheBlueAlliance";

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

  createMatch = ApiLib.createRoute<[string, number, number, MatchType, Alliance, Alliance], Match, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId, number, time, type, redAlliance, blueAlliance]) => {
      const db = await dbPromise;

      const match = await db.addObject<Match>(
        CollectionId.Matches,
        new Match(
          number,
          await GenerateSlug(CollectionId.Matches, number.toString()),
          undefined,
          time,
          type,
          blueAlliance,
          redAlliance
        )
      );
      comp.matches.push(match._id ? String(match._id) : "");

      const reportPromise = generateReportsForMatch(db, match, comp.gameId);

      await Promise.all([db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(comp._id),
        comp
      ), reportPromise]);

      return res.status(200).send(match);
    }
  });

  searchCompetitionByName = ApiLib.createRoute<[string], { value: number; pair: CompetitonNameIdPair }[], ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [name]) => {
      res.status(200).send(await tba.searchCompetitionByName(name));
    }
  });

  assignScouters = ApiLib.createRoute<[string, boolean], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId, shuffle]) => {
      const db = await dbPromise;

      if (!team?._id)
        return res.status(400).send({ error: "Team not found" });

      const result = await AssignScoutersToCompetitionMatches(
        db,
        team?._id?.toString(),
        compId,
      );

      console.log(result);
      return res.status(200).send({ result: result });
    }
  });

  submitForm = ApiLib.createRoute<[string, QuantData], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, void>({
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [reportId, formData]) => {
      const db = await dbPromise;

      const form = await db.findObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(reportId)
      );

      if (!form)
        return res.status(404).send({ error: "Report not found" });

      const team = await getTeamFromReport(db, form);
      const user = await userPromise;
      if (!onTeam(team, user) || !user?._id)
        return res.status(403).send({ error: "Unauthorized" });
      
      form.data = formData;
      form.submitted = true;
      form.submitter = user._id.toString();

      await db.updateObjectById(
        CollectionId.Reports,
        new ObjectId(reportId),
        form
      );

      addXp(db, user._id.toString(), 10);

      await db.updateObjectById(
        CollectionId.Users,
        new ObjectId(user._id.toString()),
        user
      );
      return res.status(200).send({ result: "success" });
    }
  });

  competitionReports = ApiLib.createRoute<[string, boolean, boolean], Report[], ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId, submitted, usePublicData]) => {
      const db = await dbPromise;

      const usedComps = usePublicData && comp.tbaId !== NotLinkedToTba 
        ? await db.findObjects<Competition>(CollectionId.Competitions, { publicData: true, tbaId: comp.tbaId, gameId: comp.gameId })
        : [comp];

      if (usePublicData && !comp.publicData)
        usedComps.push(comp);

      const reports = (await db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: usedComps.flatMap((m) => m.matches) },
        submitted: submitted ? true : { $exists: true },
      }))
        // Filter out comments from other competitions
        .map((report) => comp.matches.includes(report.match) ? report :  { ...report, data: { ...report.data, comments: "" } } );
      return res.status(200).send(reports);
    }
  });

  allCompetitionMatches = ApiLib.createRoute<[string], Match[], ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId]) => {
      const db = await dbPromise;

      const matches = await db.findObjects<Match>(CollectionId.Matches, {
        _id: { $in: comp.matches.map((matchId) => new ObjectId(matchId)) },
      });
      return res.status(200).send(matches);
    }
  });

  matchReports = ApiLib.createRoute<[string], Report[], ApiDependencies, { team: Team, match: Match }>({
    isAuthorized: (req, res, deps, [matchId]) => AccessLevels.IfMatchOwner(req, res, deps, matchId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, match }, [matchId]) => {
      const db = await dbPromise;

      const reports = await db.findObjects<Report>(CollectionId.Reports, {
        _id: { $in: match.reports.map((reportId) => new ObjectId(reportId)) },
      });
      return res.status(200).send(reports);
    }
  });

  changePFP = ApiLib.createRoute<[string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, void>({
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [newImage]) => {
      const db = await dbPromise;
      const user = await userPromise;

      if (!user?._id)
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<User>(
        CollectionId.Users,
        new ObjectId(user._id),
        { image: newImage }
      );

      return res.status(200).send({ result: "success" });
    }
  });

  checkInForReport = ApiLib.createRoute<[string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, void>({
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [reportId]) => {
      const db = await dbPromise;

      const report = await db.findObjectById<Report>(CollectionId.Reports, new ObjectId(reportId));
      if (!report)
        return res.status(404).send({ error: "Report not found" });

      const team = await getTeamFromReport(db, report);

      if (!onTeam(team, await userPromise))
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(reportId),
        { checkInTimestamp: new Date().toISOString() }
      );

      return res.status(200).send({ result: "success" });
    }
  });

  checkInForSubjectiveReport = ApiLib.createRoute<[string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, void>({
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [matchId]) => {
      const db = await dbPromise;

      const match = await db.findObjectById<Match>(CollectionId.Matches, new ObjectId(matchId));
      if (!match)
        return res.status(404).send({ error: "Match not found" });

      const team = await getTeamFromMatch(db, match);
      const user = await userPromise;

      if (!onTeam(team, user))
        return res.status(403).send({ error: "Unauthorized" });

      const update: { [key: string]: any } = {};
      update[`subjectiveReportsCheckInTimestamps.${user?._id?.toString()}`] = new Date().toISOString();
      await db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(matchId), update);

      return res.status(200).send({ result: "success" });
    }
  });

  remindSlack = ApiLib.createRoute<[string, string], { result: string, msgRes: any } | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team }>({
    isAuthorized: (req, res, deps, [teamId]) => AccessLevels.IfCompOwner(req, res, deps, teamId),
    handler: async (req, res, { db: dbPromise, slackClient, userPromise }, { team }, [teamId, slackId]) => {
      const db = await dbPromise;
      const user = await userPromise;

      if (!team.slackChannel)
        return res.status(200).send({ error: "Team has not linked their Slack channel" });

      const msgRes = await slackClient.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: team.slackChannel,
        text: `<@${slackId}>, please report to our section and prepare for scouting. Sent by <@${user?.slackId}>`,
      });

      return res.status(200).send({ result: "success", msgRes });
    }
  });

  setSlackId = ApiLib.createRoute<[string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, void>({
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [slackId]) => {
      const db = await dbPromise;
      const user = await userPromise;

      if (!user?._id)
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<User>(
        CollectionId.Users,
        new ObjectId(user._id),
        { slackId: slackId }
      );

      return res.status(200).send({ result: "success" });
    }
  });

  initialEventData = ApiLib.createRoute<[string], { firstRanking: TheBlueAlliance.SimpleRank[], comp: Competition, oprRanking: TheBlueAlliance.OprRanking }, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [eventKey]) => {
      const compRankingsPromise = tba.req.getCompetitonRanking(eventKey);
      const eventInformationPromise = tba.getCompetitionAutofillData(
        eventKey
      );
      const tbaOPRPromise = tba.req.getCompetitonOPRS(eventKey);

      return res.status(200).send({
        firstRanking: (await compRankingsPromise).rankings,
        comp: await eventInformationPromise,
        oprRanking: await tbaOPRPromise,
      });
    }
  });

  compRankings = ApiLib.createRoute<[string], TheBlueAlliance.SimpleRank[], ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [tbaId]) => {
      const compRankings = await tba.req.getCompetitonRanking(tbaId);
      return res.status(200).send(compRankings.rankings);
    }
  });

  statboticsTeamEvent = ApiLib.createRoute<[string, string], Statbotics.TeamEvent, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [eventKey, team]) => {
      const teamEvent = await Statbotics.getTeamEvent(eventKey, team);
      return res.status(200).send(teamEvent);
    }
  });

  getMainPageCounterData = ApiLib.createRoute<[], { teams: number | undefined, users: number | undefined, datapoints: number | undefined, competitions: number | undefined }, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { db: dbPromise }, authData, args) => {
      const db = await dbPromise;

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
    }
  });

  exportCompAsCsv = ApiLib.createRoute<[string], { csv: string } | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId]) => {
      const db = await dbPromise;

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

      const headers = Object.keys(rows[0]);

      let csv = headers.join(",") + "\n";

      for (const row of rows) {
        const data = headers.map((header) => row[header]);

        csv += data.join(",") + "\n";
      }

      res.status(200).send({ csv });
    }
  });

  teamCompRanking = ApiLib.createRoute<[string, string], { place: number | string, max: number | string }, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [tbaId, team]) => {
      const tbaResult = await tba.req.getCompetitonRanking(tbaId);
      if (!tbaResult || !tbaResult.rankings) {
        return res.status(200).send({ place: "?", max: "?" });
      }

      const { rankings } = tbaResult;

      const rank = rankings?.find((ranking) => ranking.team_key === `frc${team}`)?.rank;

      if (!rank) {
        return res.status(200).send({
          place: "?",
          max: rankings?.length,
        });
      }

      return res.status(200).send({
        place: rankings?.find((ranking) => ranking.team_key === `frc${team}`)?.rank ?? "?",
        max: rankings?.length,
      });
    }
  });

  getPitReports = ApiLib.createRoute<[string], Pitreport[], ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId]) => {
      const db = await dbPromise;

      const pitReports = await db.findObjects<Pitreport>(CollectionId.Pitreports, {
        _id: { $in: comp.pitReports.map((id) => new ObjectId(id)) },
      });

      return res.status(200).send(pitReports);
    }
  });

  changeScouterForReport = ApiLib.createRoute<[string, string], { result: string }, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [reportId]) => AccessLevels.IfCompOwner(req, res, deps, reportId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [reportId, scouterId]) => {
      const db = await dbPromise;

      await db.updateObjectById<Report>(
        CollectionId.Reports,
        new ObjectId(reportId),
        { user: scouterId }
      );

      return res.status(200).send({ result: "success" });
    }
  });

  getCompReports = ApiLib.createRoute<[string], Report[], ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId]) => {
      const db = await dbPromise;

      const reports = await db.findObjects<Report>(CollectionId.Reports, {
        match: { $in: comp.matches },
      });

      return res.status(200).send(reports);
    }
  });

  findScouterManagementData = ApiLib.createRoute<[string], { scouters: User[], matches: Match[], quantitativeReports: Report[], pitReports: Pitreport[], subjectiveReports: SubjectiveReport[] }, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId]) => {
      const db = await dbPromise;

      const promises: Promise<any>[] = [];

      const scouters: User[] = [];
      const matches: Match[] = [];
      const quantitativeReports: Report[] = [];
      const pitReports: Pitreport[] = [];
      const subjectiveReports: SubjectiveReport[] = [];

      for (const scouterId of team?.scouters) {
        promises.push(db.findObjectById<User>(CollectionId.Users, new ObjectId(scouterId)).then((scouter) => scouter && scouters.push(scouter)));
      }

      for (const matchId of comp.matches) {
        promises.push(db.findObjectById<Match>(CollectionId.Matches, new ObjectId(matchId)).then((match) => match && matches.push(match)));
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
    }
  });

  getPicklist = ApiLib.createRoute<[string], DbPicklist | undefined, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [id]) => AccessLevels.IfCompOwner(req, res, deps, id),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [id]) => {
      const db = await dbPromise;

      const picklist = await db.findObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(id));

      return res.status(200).send(picklist);
    }
  });

  updatePicklist = ApiLib.createRoute<[DbPicklist], { result: string }, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [picklist]) => AccessLevels.IfCompOwner(req, res, deps, picklist._id),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [picklist]) => {
      const db = await dbPromise;

      const { _id, ...picklistData } = picklist;
      await db.updateObjectById<DbPicklist>(CollectionId.Picklists, new ObjectId(picklist._id), picklistData);
      return res.status(200).send({ result: "success" });
    }
  });

  setCompPublicData = ApiLib.createRoute<[string, boolean], { result: string }, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId, publicData]) => {
      const db = await dbPromise;

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId), { publicData: publicData });
      return res.status(200).send({ result: "success" });
    }
  });

  setOnboardingCompleted = ApiLib.createRoute<[string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, void>({
    isAuthorized: AccessLevels.IfSignedIn,
    handler: async (req, res, { db: dbPromise, userPromise }, authData, [userId]) => {
      const db = await dbPromise;
      const user = await userPromise;
      if (!user?._id)
        return res.status(403).send({ error: "Unauthorized" });

      await db.updateObjectById<User>(CollectionId.Users, new ObjectId(user._id), { onboardingComplete: true });
      return res.status(200).send({ result: "success" });
    }
  });

  submitSubjectiveReport = ApiLib.createRoute<[SubjectiveReport, string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team, match: Match }>({
    isAuthorized: (req, res, deps, [report, matchId]) => AccessLevels.IfMatchOwner(req, res, deps, matchId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, match }, [report, matchId]) => {
      const db = await dbPromise;
      const rawReport = report as SubjectiveReport;

      const user = await userPromise;

      if (!onTeam(team, user))
        return res.status(403).send({ error: "Unauthorized" });

      const newReport: SubjectiveReport = {
        ...report,
        _id: new ObjectId().toString(),
        submitter: user!._id!.toString(),
        submitted: match.subjectiveScouter === user!._id!.toString()
          ? SubjectiveReportSubmissionType.ByAssignedScouter
          : team!.subjectiveScouters.find(id => id === user!._id!.toString())
            ? SubjectiveReportSubmissionType.BySubjectiveScouter
            : SubjectiveReportSubmissionType.ByNonSubjectiveScouter,
      };

      const update: Partial<Match> = {
        subjectiveReports: [...match.subjectiveReports ?? [], newReport._id!.toString()],
      };

      if (match.subjectiveScouter === user!._id!.toString())
        update.assignedSubjectiveScouterHasSubmitted = true;

      const insertReportPromise = db.addObject<SubjectiveReport>(CollectionId.SubjectiveReports, newReport);
      const updateMatchPromise = db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(match._id), update);

      addXp(db, user!._id!, match.subjectiveScouter === user!._id!.toString() ? 10 : 5);

      await Promise.all([insertReportPromise, updateMatchPromise]);
      return res.status(200).send({ result: "success" });
    }
  });

  getSubjectiveReportsForComp = ApiLib.createRoute<[string], SubjectiveReport[], ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId]) => {
      const db = await dbPromise;

      const reports = await db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        match: { $in: comp.matches },
      });

      return res.status(200).send(reports);
    }
  });

  updateSubjectiveReport = ApiLib.createRoute<[SubjectiveReport], { result: string }, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [report]) => AccessLevels.IfCompOwner(req, res, deps, report._id?.toString() ?? ""),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [report]) => {
      const db = await dbPromise;

      await db.updateObjectById<SubjectiveReport>(CollectionId.SubjectiveReports, new ObjectId(report._id), report);
      return res.status(200).send({ result: "success" });
    }
  });

  setSubjectiveScouterForMatch = ApiLib.createRoute<[string], { result: string }, ApiDependencies, { team: Team, match: Match }>({
    isAuthorized: (req, res, deps, [matchId]) => AccessLevels.IfMatchOwner(req, res, deps, matchId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, match }, [matchId]) => {
      const db = await dbPromise;
      const user = await userPromise;

      await db.updateObjectById<Match>(CollectionId.Matches, new ObjectId(matchId), {
        subjectiveScouter: user!._id?.toString(),
      });
      return res.status(200).send({ result: "success" });
    }
  });

  regeneratePitReports = ApiLib.createRoute<[string], { result: string, pitReports: string[] } | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, tba, userPromise }, { team, comp }, [compId]) => {
      const db = await dbPromise;

      if (!comp.tbaId)
        return res.status(200).send({ error: "not linked to TBA" });

      const pitReports = await generatePitReports(tba, db, comp.tbaId, comp.gameId);

      await db.updateObjectById(
        CollectionId.Competitions,
        new ObjectId(compId),
        { pitReports: pitReports }
      );

      return res.status(200).send({ result: "success", pitReports });
    }
  });

  createPitReportForTeam = ApiLib.createRoute<[number, string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [teamNumber, compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [teamNumber, compId]) => {
      const db = await dbPromise;

      const pitReport = new Pitreport(teamNumber, games[comp.gameId].createPitReportData());
      const pitReportId = (await db.addObject<Pitreport>(CollectionId.Pitreports, pitReport))._id?.toString();

      if (!pitReportId)
        return res.status(500).send({ error: "Failed to create pit report" });

      comp.pitReports.push(pitReportId);

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId), {
        pitReports: comp.pitReports,
      });

      return res.status(200).send({ result: "success" });
    }
  });

  updateCompNameAndTbaId = ApiLib.createRoute<[string, string, string], { result: string } | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId, name, tbaId]) => {
      const db = await dbPromise;

      await db.updateObjectById<Competition>(CollectionId.Competitions, new ObjectId(compId), {
        name,
        tbaId,
      });

      return res.status(200).send({ result: "success" });
    }
  });

  getFtcTeamAutofillData = ApiLib.createRoute<[number], Team | undefined, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, { tba }, authData, [teamNumber]) => {
      const team = await TheOrangeAlliance.getTeam(teamNumber);
      return res.status(200).send(team);
    }
  });

  ping = ApiLib.createRoute<[], { result: string }, ApiDependencies, void>({
    isAuthorized: AccessLevels.AlwaysAuthorized,
    handler: async (req, res, authData, args) => {
      return res.status(200).send({ result: "success" });
    }
  });

  getSubjectiveReportsFromMatches = ApiLib.createRoute<[string, Match[]], SubjectiveReport[] | ApiLib.Errors.ErrorType, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [compId]) => AccessLevels.IfCompOwner(req, res, deps, compId),
    handler: async (req, res, { db: dbPromise, userPromise }, { team, comp }, [compId, matches]) => {
      const db = await dbPromise;

      for (const match of matches) {
        if (!comp.matches.find(id => id === match._id?.toString()))
          return res.status(400).send({ error: "Match not in competition" });
      }

      const matchIds = matches.map((match) => match._id?.toString());
      const reports = await db.findObjects<SubjectiveReport>(CollectionId.SubjectiveReports, {
        match: { $in: matchIds },
      });

      return res.status(200).send(reports);
    }
  });

  uploadSavedComp = ApiLib.createRoute<[SavedCompetition], { result: string }, ApiDependencies, { team: Team, comp: Competition }>({
    isAuthorized: (req, res, deps, [save]) => AccessLevels.IfCompOwner(req, res, deps, save.comp._id?.toString() ?? ""),
    handler: async (req, res, { db: dbPromise, userPromise }, { team }, [save]) => {
      const db = await dbPromise;

      const { comp, matches, quantReports: reports, pitReports, subjectiveReports } = save;

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
    }
  });

  removeUserFromTeam = ApiLib.createRoute<[string, string], { result: string, team: Team } | ApiLib.Errors.ErrorType, ApiDependencies, Team>({
    isAuthorized: (req, res, deps, [teamId]) => AccessLevels.IfTeamOwner(req, res, deps, teamId),
    handler: async (req, res, { db: dbPromise, userPromise }, team, [teamId, userId]) => {
      const db = await dbPromise;

      const removedUserPromise = db.findObjectById<User>(CollectionId.Users, new ObjectId(userId));

      const newTeam: Team = {
        ...team,
        users: team.users.filter((id) => id !== userId),
        owners: team.owners.filter((id) => id !== userId),
        scouters: team.scouters.filter((id) => id !== userId),
        subjectiveScouters: team.subjectiveScouters.filter((id) => id !== userId),
      }
      
      const teamPromise = db.updateObjectById<Team>(CollectionId.Teams, new ObjectId(teamId), newTeam);

      const removedUser = await removedUserPromise;
      if (!removedUser)
        return res.status(404).send({ error: "User not found" });

      const newUserData: User = {
        ...removedUser,
        teams: removedUser.teams.filter((id) => id !== teamId),
        owner: removedUser.owner.filter((id) => id !== teamId),
      }

      await db.updateObjectById<User>(CollectionId.Users, new ObjectId(userId), newUserData);
      await teamPromise;

      return res.status(200).send({ result: "success", team: newTeam });
    }
  });
}
