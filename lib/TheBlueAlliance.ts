import stringSimilarity from "string-similarity-js";
import { GetDatabase, MongoDBInterface } from "./MongoDB";
import { Competition, Match, Team, CompetitonNameIdPair, MatchType } from "./Types";

export namespace TheBlueAlliance {

    export interface SimpleTeam {
        key: string,
        team_number: number,
        nickname: string,
        name: string,
        city: string,
        state_prov: string,
        country: string
    }

    export interface SimpleDistrict {
        abbreviation: string,
        display_name: string,
        key: string,
        year: number,
    }

    export interface SimpleCompetition {
        key: string,
        name: string,
        event_code: string,
        event_type: number,
        district: SimpleDistrict,
        city: string,
        state_prov: string,
        country: string,
        start_date: string, //"2023-04-26"
        end_date: string,
        year: number
    }

    export enum CompetitionLevel {
        QM="qm",
        EF="ef",
        QF="qf",
        SF="sf",
        F="f",
    }

    export interface Alliances {
        red: Alliance,
        blue: Alliance,
    }

    export interface Alliance {
        score: number,
        team_keys: string[],
        surrogate_team_keys: string[],
        dq_team_keys: string[],
    }

    export enum WinningAlliance {
        Red="red",
        Blue="blue",
    }

    export interface SimpleMatch {
        key: string,
        comp_level: CompetitionLevel, // qm
        set_number: number,
        match_number: number,
        alliances: Alliances,
        winning_alliance: WinningAlliance,
        event_key: string,
        time: number,
        predicted_time: number,
        actual_time: number,
    }

    export interface District {
        key: string,
        display_name: string,
        year: number,
        abbreviation: string,
    }

    export enum Prefixes {
        FTC="ftc",
        FRC="frc",
    }

    export function ConvertDate(tbaDate: string): number {
        return Date.parse(tbaDate);
    }

    class Request {

        baseUrl : string;
        apiKey : string;
    
        constructor(baseUrl=process.env.TBA_URL, apiKey=process.env.TBA_KEY) {
            this.baseUrl = baseUrl;
            this.apiKey = apiKey;
        };
    
        async request(suburl: string) : Promise<any> {
            var res = await fetch(this.baseUrl + suburl, {
                method: "GET",
                headers: {
                    "X-TBA-Auth-Key": this.apiKey,
                }
            });
    
            return res.json();
        };
    
        async getTeam(tbaId: string): Promise<SimpleTeam> {
            return this.request(`/team/${tbaId}/simple`);
        }
    
        async getCompetition(tbaId: string): Promise<SimpleCompetition> {
            return this.request(`/event/${tbaId}/simple`)
        }
     
        async getCompetitionMatches(tbaId: string): Promise<SimpleMatch[]> {
            return this.request(`/event/${tbaId}/matches`);
        }
    
        async getMatch(tbaId: string): Promise<SimpleMatch> {
            return this.request(`/match/${tbaId}/simple`)
        }

        async getDistricts(year: number): Promise<District[]> {
            return this.request(`/districts/${year}`)
        }

        async getDistrictEvents(tbaId: string): Promise<SimpleCompetition[]> {
            return this.request(`/district/${tbaId}/events/simple`)
        }

        async getEvents(year: number): Promise<SimpleCompetition[]> {
            return this.request(`/events/${year}/simple`)
        }
    };

    export class Interface {
        req : Request;
        db: Promise<MongoDBInterface>;

        competitionPairings: CompetitonNameIdPair[] = [];
        constructor() {
            this.req = new Request();
            this.db = GetDatabase();

            this.loadCompetitionPairings();+96

        }

        competitionLevelToMatchType(matchType: CompetitionLevel): MatchType {
            if(matchType === CompetitionLevel.QM) {
                return MatchType.Qualifying
            } if(matchType === CompetitionLevel.EF) {
                return MatchType.Qualifying;
            } if(matchType === CompetitionLevel.QF) {
                return MatchType.Quarterfinals
            } if(matchType === CompetitionLevel.SF) {
                return MatchType.Semifinals
            } else {
                return MatchType.Finals;
            }
        }
        

        async getTeamAutofillData(teamNumber: number): Promise<Team> {
            let team = await this.req.getTeam(Prefixes.FRC + teamNumber.toString());
            if(!team) {
                team = await this.req.getTeam(Prefixes.FTC + teamNumber.toString());
            }

            return new Team(team.nickname, undefined, team.key, team.team_number);
        }

        async getCompetitionAutofillData(tbaId: string): Promise<Competition> {
            var competitonData = await this.req.getCompetition(tbaId);
            let competition = new Competition(competitonData.name, undefined, competitonData.key, ConvertDate(competitonData.start_date), ConvertDate(competitonData.end_date));
            
           // maybe give automatic matches later, once scouting is more stabilized
           return competition;
        }

        async getMatchAutofillData(tbaId: string): Promise<Match> {
            let data = await this.req.getMatch(tbaId);
            return new Match(data.match_number, undefined, data.key, data.time, this.competitionLevelToMatchType(data.comp_level));
        }

        async getCompetitionMatches(tbaId: string): Promise<Match[]> {
            let matches = (await this.req.getCompetitionMatches(tbaId)).map((data) => new Match(data.match_number, undefined, data.key, data.time, this.competitionLevelToMatchType(data.comp_level)));
            return matches;
        }

        async getMatchAndReportsAutofillData() {
            throw new Error();
        }

        async searchCompetitionByName(name: string, trim:number=5) {
            var results:{value: number, pair: CompetitonNameIdPair}[] = []
            this.competitionPairings.forEach((pair) => {
                results.push({value: stringSimilarity(name, pair.name), pair});
            })

            results.sort((a, b) => {
                if(a.value < b.value) {
                    return 1;
                } else if(a.value > b.value) {
                    return -1;
                }

                return 0;
            })

            results = results.slice(0, trim);
            return results
        }

        async loadCompetitionPairings() {
            console.log("Loading Pairings For Competition Searches...");
            const year = new Date().getFullYear();
            const pairings = await this.allCompetitionsToPairings(year);
            console.log(`Loaded ${pairings.length} Pairings!`);

            this.competitionPairings = pairings;
        }

        async allCompetitionsToPairings(year: number) {
            var allCompetitions = await this.req.getEvents(year);
            var pairings: CompetitonNameIdPair[] = [];
            allCompetitions.forEach((comp) => {
                pairings.push({name: comp.name, tbaId: comp.key});
            });

            return pairings;
        }
    }
}