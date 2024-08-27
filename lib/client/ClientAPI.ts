import { Statbotics } from "../Statbotics";
import { TheBlueAlliance } from '@/lib/TheBlueAlliance';
import {
  Competition,
  Season,
  Team,
  User,
  Match,
  CompetitonNameIdPair,
  Report,
  MatchType,
  QuantData,
  EventData,
  Pitreport,
  DbPicklist,
  SubjectiveReport,
  League,
  SavedCompetition,
} from "../Types";
import { GameId } from "./GameId";
import { assignScoutersOffline, updateCompInLocalStorage } from "./offlineUtils";
import { BSON, ObjectId } from 'bson';

export enum ClientRequestMethod {
  POST = "POST",
  GET = "GET",
}

export default class ClientAPI {
  baseUrl: string;
  authenticationKey: string = "";

  // replace this with the process.env
  constructor(
    authKey = "",
    baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "/api"
  ) {
    this.authenticationKey = authKey;
    this.baseUrl = baseUrl;
  }

  setAuth(authKey: string) {
    this.authenticationKey = authKey;
  }

  async request(
    subUrl: string,
    body: any,
    method: ClientRequestMethod = ClientRequestMethod.POST
  ) {
    const rawResponse = await fetch(this.baseUrl + subUrl, {
      method: method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "gearbox-auth": this.authenticationKey,
      },
      body: JSON.stringify(body),
    });
    
    return await rawResponse.json().catch(() => console.error("Failed to parse response"));
  }
  
  /**
   * @param fallback only use if you are just a fetching a single user. Using fallback for many users will take a long time.
   */
  async findUserById(id: ObjectId | undefined, fallback: User | undefined = undefined): Promise<User> {
    try {
      return await this.request("/find", {
        collection: "users",
        query: { _id: id },
      }).catch(() => fallback);
    }
    catch(e) {
      if (fallback)
        return fallback;
      throw e;
    }
  }

  async findTeamById(id: string): Promise<Team> {
    return await this.request("/find", {
      collection: "Teams",
      query: { _id: id },
    });
  }

  async findTeamByNumberAndLeague(n: number, league: League): Promise<Team> {
    const query = league === League.FRC 
      ? { 
          number: n,
          $or: [ 
            { league: league }, 
            { tbaId: { $exists: true } } 
          ]
        } 
      : { number: n, league: league };

    return await this.request("/find", {
      collection: "Teams",
      query,
    });
  }

  async findSeasonById(id: ObjectId): Promise<Season> {
    return await this.request("/find", {
      collection: "Seasons",
      query: { _id: id },
    });
  }

  async findCompetitionById(id: ObjectId): Promise<Competition> {
    return await this.request("/find", {
      collection: "Competitions",
      query: { _id: id },
    });
  }

  async findMatchById(id: ObjectId): Promise<Match> {
    return await this.request("/find", {
      collection: "Matches",
      query: { _id: id },
    });
  }

  async findReportById(id: ObjectId): Promise<Report> {
    return await this.request("/find", {
      collection: "Reports",
      query: { _id: id },
    });
  }

  async findPitreportById(id: ObjectId): Promise<Pitreport> {
    return await this.request("/find", {
      collection: "Pitreports",
      query: { _id: id },
    });
  }

  /**
   * @deprecated does not have security checks
   */
  async allTeams(): Promise<Team[]> {
    return await this.request("/findAll", { collection: "Teams" });
  }

  async getTeamAutofillData(teamNumber: number | undefined, league: League = League.FRC): Promise<Team> {
    return await this.request("/teamAutofill", { number: teamNumber, league });
  }

  async getCompetitionAutofillData(tbaId: string): Promise<Competition> {
    return await this.request("/competitionAutofill", { tbaId: tbaId });
  }

  async getCompetitionMatches(tbaId: string | undefined): Promise<Match[]> {
    return await this.request("/competitionMatches", { tbaId: tbaId });
  }

  async getMatchAutofillData(tbaId: string): Promise<Competition> {
    return await this.request("/matchAutofill", { tbaId: tbaId });
  }

  async requestToJoinTeam(userId: ObjectId, teamId: ObjectId) {
    return await this.request("/requestToJoinTeam", {
      userId: userId,
      teamId: teamId,
    });
  }

  async handleRequest(accept: boolean, userId: ObjectId, teamId: ObjectId) {
    return await this.request("/handleRequest", {
      accept: accept,
      userId: userId,
      teamId: teamId,
    });
  }

  async createTeam(
    name: string,
    number: number,
    creator: ObjectId,
    tbaId: undefined | string,
    league: League
  ): Promise<Team> {
    return await this.request("/createTeam", {
      name: name,
      number: number,
      creator: creator,
      tbaId: tbaId,
      league: league,
    });
  }

  async createSeason(name: string, year: number, gameId: GameId, teamId: ObjectId): Promise<Season> {
    return await this.request("/createSeason", {
      name: name,
      year: year,
      gameId: gameId,
      teamId: teamId,
    });
  }

  async changePFP(userId: string | undefined, newImage: string | undefined) {
    return await this.request("/changePFP", {
      userId: userId,
      newImage: newImage,
    });
  }

  async createMatch(
    compId: ObjectId,
    number: number,
    type: MatchType,
    blueAlliance: number[],
    redAlliance: number[],
    ownerTeam: ObjectId,
    ownerComp: ObjectId
  ) {
    return await this.request("/createMatch", {
      number,
      type,
      blueAlliance,
      redAlliance,
      compId,
      ownerTeam,
      ownerComp,
    });
  }

  async createCompetition(
    name: string,
    tbaId: string | undefined,
    start: number,
    end: number,
    seasonId: ObjectId | undefined,
    publicData: boolean
  ): Promise<Competition> {
    return await this.request("/createCompetiton", {
      name,
      tbaId,
      start,
      end,
      seasonId,
      publicData
    });
  }

  async reloadCompetition(
    compId: ObjectId,
    tbaId: string
  ) {
    return await this.request("/reloadCompetition", {
      compId: compId,
      tbaId: tbaId,
    });
  }

  async searchCompetitionByName(
    name: string | undefined
  ): Promise<{ value: number; pair: CompetitonNameIdPair }[]> {
    return await this.request("/searchCompetitionByName", { name: name });
  }

  async updateUser(newValues: object, userId: string) {
    return await this.request("/update", {
      collection: "users",
      newValues: newValues,
      id: userId,
    });
  }

  async updateTeam(newValues: object, teamId: ObjectId) {
    return await this.request("/update", {
      collection: "Teams",
      newValues: newValues,
      id: teamId,
    });
  }

  async updateSeason(newValues: object, seasonId: string | undefined) {
    return await this.request("/update", {
      collection: "Seasons",
      newValues: newValues,
      id: seasonId,
    });
  }

  async updateReport(newValues: Partial<Report>, reportId: ObjectId) {
    return await this.request("/update", {
      collection: "Reports",
      newValues: newValues,
      id: reportId,
    });
  }

  async assignScouters(
    teamId: ObjectId,
    compId: ObjectId,
    shuffle: boolean = false,
    fallback: SavedCompetition | undefined = undefined
  ) {
    try {
      return await this.request("/assignScouters", {
        teamId: teamId,
        compId: compId,
        shuffle: shuffle,
      });
    } catch(e) {
      if (fallback) {
        updateCompInLocalStorage(fallback.comp._id.toString() ?? "", assignScoutersOffline);
        return fallback;
      }
    }
  }

  /**
   * @deprecated Server should find userId, not client
   */
  async submitForm(
    reportId: ObjectId,
    formData: QuantData | undefined,
    userId: ObjectId
  ) {
    return await this.request("/submitForm", {
      reportId: reportId,
      formData: formData,
      userId: userId,
    });
  }

  async updatePitreport(
    pitreportId: ObjectId,
    data: object | undefined
  ) {
    return await this.request("/update", {
      collection: "Pitreports",
      newValues: data,
      id: pitreportId,
    });
  }

  async competitionReports(compId: ObjectId, submitted: boolean, usePublicData: boolean = false, 
      fallback: Report[] | undefined = undefined) {
    try {
      return await this.request("/competitionReports", {
        compId,
        submitted,
        usePublicData
      });
    } catch(e) {
      if (fallback)
        return fallback;
      throw e;
    }
  }

  async allCompetitionMatches(compId: ObjectId, fallback: Match[] | undefined = undefined) {
    try {
      return await this.request("/allCompetitionMatches", { compId: compId });
    } catch(e) {
      if (fallback)
        return fallback;
      throw e;
    }
  }

  async matchReports(matchId: ObjectId) {
    return await this.request("/matchReports", { matchId: matchId });
  }

  async checkInForReport(reportId: ObjectId) {
    return await this.request("/checkInForReport", { reportId });
  }

  async updateCheckOut(reportId: ObjectId) {
    return await this.request("/updateCheckOut", { reportId });
  }

  async checkInForSubjectiveReport(matchId: ObjectId) {
    return await this.request("/checkInForSubjectiveReport", { matchId });
  }

  async remindSlack(
    slackId: string,
    senderSlackId: string,
    teamId: ObjectId
  ) {
    return await this.request("/remindSlack", { slackId, senderSlackId, teamId });
  }

  async setSlackId(userId: string | undefined, slackId: string | undefined) {
    return await this.request("/setSlackId", { userId, slackId });
  }

  async addUserXp(
    userId: string | undefined,
    oweBucksToAdd: number | undefined
  ) {
    return await this.request("/addUserXp", {
      userId,
      oweBucksToAdd,
    });
  }

  async initialEventData(eventKey: string | undefined): Promise<EventData> {
    return await this.request("/initialEventData", { eventKey });
  }

  async compRankings(tbaId: string | undefined): Promise<TheBlueAlliance.SimpleRank[]> {
    return await this.request("/compRankings", { tbaId });
  }

  async statboticsTeamEvent(
    eventKey: string,
    team: string
  ): Promise<Statbotics.TeamEvent> {
    return await this.request("/statboticsTeamEvent", {
      team,
      eventKey,
    });
  }

  async getMainPageCounterData(): Promise<{
    teams: number | null;
    users: number | null;
    datapoints: number | null;
    competitions: number | null;
  }> {
    return await this.request("/getMainPageCounterData", {});
  }

  async exportCompAsCsv(compId: ObjectId | undefined) {
    return await this.request("/exportCompAsCsv", { compId });
  }

  async regeneratePitReports(tbaId: string, compId: ObjectId, ownerTeam: ObjectId) {
    return await this.request("/regeneratePitReports", { tbaId, compId, ownerTeam });
  }

  async teamCompRanking(tbaId: string, team: number): Promise<{ place: number | string, max: number }> {
    return await this.request("/teamCompRanking", { tbaId, team });
  }

  async getPitReports(reportIds: ObjectId[]) {
    return await this.request("/getPitReports", { reportIds });
  }

  async changeScouterForReport(reportId: ObjectId, scouterId: ObjectId, compId: ObjectId) {
    updateCompInLocalStorage(compId, (comp) => {
      const report = Object.values(comp.quantReports).find(r => r._id === reportId);
      if (report) {
        report.user = scouterId;
      }
    });

    return await this.request("/changeScouterForReport", { reportId, scouterId });
  }

  async getCompReports(compId: string): Promise<Report[]> {
    return await this.request("/getCompReports", { compId });
  }

  async findScouterManagementData(compId: ObjectId, scouterIds: ObjectId[]): Promise<{
    scouters: User[],
    matches: Match[],
    quantitativeReports: Report[],
    pitReports: Pitreport[],
    subjectiveReports: SubjectiveReport[],
  }> {
    return await this.request("/findScouterManagementData", { compId, scouterIds });
  }

  async getPicklist(id: ObjectId): Promise<DbPicklist> {
    return await this.request("/getPicklist", { id });
  }

  async updatePicklist(picklist: DbPicklist) {
    return await this.request("/updatePicklist", { picklist });
  }

  async setCompPublicData(compId: ObjectId, publicData: boolean) {
    updateCompInLocalStorage(compId, (comp) => comp.comp.publicData = publicData);

    return await this.request("/setCompPublicData", { compId, publicData });
  }

  async setOnboardingCompleted(userId: ObjectId) {
    return await this.request("/setOnboardingCompleted", { userId });
  }

  async submitSubjectiveReport(report: SubjectiveReport, userId: ObjectId, teamSlug: string) {
    return await this.request("/submitSubjectiveReport", { report, userId, teamSlug });
  }

  async getSubjectiveReportsForComp(compId: ObjectId): Promise<SubjectiveReport[]> {
    return await this.request("/getSubjectiveReportsForComp", { compId });
  }

  async updateSubjectiveReport(reportId: ObjectId, report: Partial<SubjectiveReport>) {
    return await this.request("/updateSubjectiveReport", { reportId, report });
  }

  async setSubjectiveScouterForMatch(matchId: ObjectId, userId: ObjectId | undefined, compId: ObjectId) {
    updateCompInLocalStorage(compId, (comp) => {
      const match = Object.values(comp.matches).find(m => m._id === matchId);
      if (match) {
        match.subjectiveScouter = userId;
      }
    });

    return await this.request("/setSubjectiveScouterForMatch", { matchId, userId });
  }

  async createPitReportForTeam(teamNumber: number, compId: ObjectId, ownerTeam: ObjectId) {
    updateCompInLocalStorage(compId, (comp) => {
      const pitReport = new Pitreport(teamNumber, comp.game.createPitReportData(), ownerTeam, compId);
      pitReport._id = new ObjectId();

      comp.pitReports[pitReport.teamNumber] = pitReport;
      comp.comp.pitReports.push(pitReport._id);
    });

    return await this.request("/createPitReportForTeam", { teamNumber, compId });
  }

  async updateCompNameAndTbaId(compId: ObjectId, name: string, tbaId: string) {
    updateCompInLocalStorage(compId, (comp) => {
      comp.comp.name = name;
      comp.comp.tbaId = tbaId;
    });

    return await this.request("/updateCompNameAndTbaId", { compId, name, tbaId });
  }

  async getFtcTeamAutofillData(teamNumber: number): Promise<Team> {
    return await this.request("/getFtcTeamAutofillData", { teamNumber });
  }

  async ping() {
    return await this.request("/ping", {});
  }

  async getSubjectiveReportsFromMatches(matches: Match[], fallback: SubjectiveReport[] | undefined = undefined): Promise<SubjectiveReport[]> {
    try {
      return await this.request("/getSubjectiveReportsFromMatches", { matches });
    }
    catch(e) {
      if (fallback)
        return fallback;
      throw e;
    }
  }

  async uploadSavedComp(save: SavedCompetition): Promise<void> {
    return await this.request("/uploadSavedComp", { save });
  }

}
