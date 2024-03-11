
import { Competition, Season, Team, User, Match, Form, CompetitonNameIdPair, Report, MatchType, FormData } from "../Types";

export enum ClientRequestMethod {
    POST="POST",
    GET="GET"
};

export default class ClientAPI {

    baseUrl: string;
    authenticationKey: string = ""

    // replace this with the process.env
    constructor(authKey="", baseUrl="https://localhost:3000/api") {
        this.authenticationKey = authKey;
        this.baseUrl = baseUrl;
    }

    setAuth(authKey: string) {
        this.authenticationKey = authKey;
    }

    async request(subUrl: string, body: any, method: ClientRequestMethod=ClientRequestMethod.POST) {
        const rawResponse = await fetch(this.baseUrl + subUrl, {
              method: method,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                "gearbox-auth": this.authenticationKey,
              },
              body: JSON.stringify(body)
        });
        return await rawResponse.json();
    };


    async findUserById(id: string | undefined): Promise<User> {
        return await this.request("/find", {collection: "users", query: {"_id": id}});
    }

    async findTeamById(id: string): Promise<Team> {
        return await this.request("/find", {collection: "Teams", query: {"_id": id}});
    }

    async findTeamByNumber(n: number | undefined): Promise<Team> {
        return await this.request("/find", {collection: "Teams", query: {"number": n}});
    }

    async findSeasonById(id: string): Promise<Season> {
        return await this.request("/find", {collection: "Seasons", query: {"_id": id}});
    }

    async findCompetitionById(id: string | undefined): Promise<Competition> {
        return await this.request("/find", {collection: "Competitions", query: {"_id": id}});
    }

    async findMatchById(id: string): Promise<Match> {
        return await this.request("/find", {collection: "Matches", query: {"_id": id}});
    }

    async findReportById(id: string): Promise<Report> {
        return await this.request("/find", {collection: "Reports", query: {"_id": id}});
    }

    async allTeams(): Promise<Team[]> {
        return await this.request("/findAll",  {collection: "Teams"})
    }

    async getTeamAutofillData(teamNumber: number | undefined): Promise<Team> {
        return await this.request("/teamAutofill", {number: teamNumber});
    }

    async getCompetitionAutofillData(tbaId: string): Promise<Competition> {
        return await this.request("/competitionAutofill", {tbaId: tbaId});
    }

    async getCompetitionMatches(tbaId: string | undefined): Promise<Match[]> {
        return await this.request("/competitionMatches", {tbaId: tbaId});
    }

    async getMatchAutofillData(tbaId: string): Promise<Competition> {
        return await this.request("/matchAutofill", {tbaId: tbaId});
    }

    async teamRequest(userId: string | undefined, teamId: string | undefined) {
        return await this.request("/teamRequest", {userId: userId, teamId: teamId});
    }

    async handleRequest(accept: boolean, userId: string, teamId: string) {
        return await this.request("/handleRequest", {accept: accept, userId: userId, teamId: teamId});
    }

    async createTeam(name: string, number: number, creator: string | undefined, tbaId: undefined | string) {
        return await this.request("/createTeam", {name: name, number: number, creator: creator, tbaId: tbaId});
    }

    async createSeason(name: string, year: number, teamId: string) {
        return await this.request("/createSeason", {name: name, year: year, teamId: teamId});
    }

    async changePFP(userId: string | undefined, newImage: string | undefined) {
        return await this.request("/changePFP",{userId: userId, newImage: newImage})
    }

    async createMatch(compId: string | undefined, number: number, type: MatchType, blueAlliance: number[], redAlliance: number[]) {
        return await this.request("/createMatch", {number: number, type: type, blueAlliance: blueAlliance, redAlliance: redAlliance, compId: compId});
    }

    async createCompetition(name: string, tbaId: string | undefined, start: number, end: number, seasonId: string | undefined) {
        return await this.request("/createCompetiton", {name: name, tbaId: tbaId, start: start, end: end, seasonId: seasonId});
    }

    async searchCompetitionByName(name: string | undefined): Promise<{value: number, pair: CompetitonNameIdPair}[]> {
        return await this.request("/searchCompetitionByName", {name: name});
    }


    async updateUser(newValues: object, userId: string) {
        return await this.request("/update", {collection: "users", newValues: newValues, id: userId})
    }

    async updateTeam(newValues: object, teamId: string | undefined) {
        return await this.request("/update", {collection: "Teams", newValues: newValues, id: teamId})
    }

    async updateSeason(newValues: object, seasonId: string | undefined) {
        return await this.request("/update", {collection: "Seasons", newValues: newValues, id: seasonId})
    }

    async updateReport(newValues: object, reportId: string | undefined) {
        return await this.request("/update", {collection: "Reports", newValues: newValues, id: reportId})
    }

    async assignScouters(teamId: string | undefined, compId: string | undefined, shuffle: boolean=false) {
        return await this.request("/assignScouters", {teamId: teamId, compId: compId, shuffle: shuffle})
    }

    async submitForm(reportId: string | undefined, formData: FormData | undefined, userId: string | undefined) {
        return await this.request("/submitForm", {reportId: reportId, formData: formData, userId: userId});
    }

    async competitionReports(compId: string | undefined, submitted: boolean) {
        return await this.request("/competitionReports", {compId: compId, submitted: submitted});
    }

    async allCompetitionMatches(compId: string | undefined) {
        return await this.request("/allCompetitionMatches", {compId: compId})
    }

    async matchReports(matchId: string | undefined) {
        return await this.request("/matchReports", {matchId: matchId})
    }

    async updateCheckIn(reportId: string | undefined) {
        return await this.request("/updateCheckIn", {reportId})
    }

    async updateCheckOut(reportId: string | undefined) {
        return await this.request("/updateCheckOut", {reportId})
    }

    async remindSlack(slackId: string | undefined) {
        return await this.request("/remindSlack", {slackId})
    }

    async setSlackId(userId: string | undefined, slackId: string | undefined){
        return await this.request("/setSlackId", {userId, slackId})
    }

    async updateOwebucks(userId: string | undefined, oweBucks: number | undefined, oweBucksToAdd: number | undefined){
        return await this.request("/setOwebucks", {userId, oweBucks, oweBucksToAdd})
    }
};
