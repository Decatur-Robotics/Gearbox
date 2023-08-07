// think of this as JAI but "better"

import { Competition, Season, Team, User, Match, Form, FormElement, CompetitonNameIdPair } from "../Types";

export enum ClientRequestMethod {
    POST="POST",
    GET="GET"
};

export default class ClientAPI {

    baseUrl: string;

    // replace this with the process.env
    constructor(baseUrl="http://localhost:3000/api/") {
        this.baseUrl = baseUrl;
    }

    async request(subUrl: string, body: any, method: ClientRequestMethod=ClientRequestMethod.POST) {
        const rawResponse = await fetch(this.baseUrl + subUrl, {
              method: method,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(body)
        });
        return await rawResponse.json();
    };


    async findUserById(id: string): Promise<User> {
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

    async findFormById(id: string | undefined): Promise<Form> {
        return await this.request("/find", {collection: "Forms", query: {"_id": id}});
    }

    async findCompetitionById(id: string | undefined): Promise<Competition> {
        return await this.request("/find", {collection: "Competitions", query: {"_id": id}});
    }

    async findMatchById(id: string): Promise<Match> {
        return await this.request("/find", {collection: "Matches", query: {"_id": id}});
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

    async createForm(name: string, data: FormElement[], seasonId: string | undefined) {
        return await this.request("/createForm", {name: name, data: data, seasonId: seasonId})
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

    async updateForm(newValues: object, formId: string | undefined) {
        return await this.request("/update", {collection: "Forms", newValues: newValues, id: formId})
    }
};