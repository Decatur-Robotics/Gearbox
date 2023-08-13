import { NextApiRequest, NextApiResponse } from "next";
import { Collections, GetDatabase, MongoDBInterface } from "./MongoDB";
import { TheBlueAlliance } from "./TheBlueAlliance";
import { Alliance, Competition, Form, Match, Season, Team, User } from "./Types";
import { GenerateSlug } from "./Utils";
import { ObjectId } from "mongodb";
import { fillTeamWithFakeUsers } from "./dev/FakeData";

export namespace API {

    type Route = (req: NextApiRequest, res: NextApiResponse, contents: {db: MongoDBInterface, tba: TheBlueAlliance.Interface, data: any}) => Promise<void>;
    type RouteCollection = { [routeName: string]: Route};
    
    export class Handler {
        // feed routes as big object ot tjhe handler
        routes: RouteCollection;
        db: Promise<MongoDBInterface>;
        tba: TheBlueAlliance.Interface;
        basePath: string;
        
        constructor(apiRoutes: RouteCollection, base="/api/") {
            this.routes = apiRoutes;
            this.db = GetDatabase();
            this.tba = new TheBlueAlliance.Interface();
            this.basePath = base;
        }

        async handleRequest(req: NextApiRequest, res: NextApiResponse) {
            
            if(!req.url) {
                res.status(404).send({"error": "API Route Does Not Exist"});
                return;
            }

            var route = req.url.replace(this.basePath, "");
            
            if(route in this.routes) {
                this.routes[route](req, res, {db:await this.db, tba:this.tba, data:req.body});
            } else {
                res.status(404).send({"error": "API Route Does Not Exist"});
            }
        }
    }

    export const Routes: RouteCollection = {

        "hello": async (req, res, {db, data}) => {
            res.status(200).send({"message": "howdy there partner", "db": db ? "connected": "disconnected", "data": data});
        },

        // crud operations- no need to make extra endpoints when we can just shape the query client side;
        // FORCE THEM TO USE POST
        "add": async (req, res, {db, data}) => {
            // {
            //     collection, 
            //     object
            // }
            const collection = data.collection;
            const object = data.object;
            
            res.status(200).send(await db.addObject(collection, object));
        },

        "update": async (req, res, {db, data}) => {
            // {
            //     collection, 
            //      id,
            //     newValues,
            // }
            const collection = data.collection;
            const id = data.id;
            const newValues = data.newValues;
            
            res.status(200).send(await db.updateObjectById(collection, new ObjectId(id), newValues));
        },

        "delete": async (req, res, {db, data}) => {
            // {
            //     collection, 
            //     id
            // }
            const collection = data.collection;
            const id = data.id;
            
            
            res.status(200).send(await db.deleteObjectById(collection, id));
        },

        "find": async (req, res, {db, data}) => {
            // {
            //     collection, 
            //     query
            // }
            const collection = data.collection;
            const query = data.query;

            if(query._id) {
                query._id = new ObjectId(query._id);
            }

            let obj = await db.findObject(collection, query);
            if(!obj) {
                obj = {}
            }
            
            res.status(200).send(obj)
        },

        "findAll": async (req, res, {db, data}) => {
            // {
            //     collection, 
            // }
            const collection = data.collection;
            
            res.status(200).send(await db.findObjects(collection, {}))
        },


        // modification

        "teamRequest": async (req, res, {db, data}) => {
            // {
            //     teamId
            //     userId
            // }
            
            let team = await db.findObjectById<Team>(Collections.Teams, new ObjectId(data.teamId));
            team.requests = [...team.requests, data.userId];

            return res.status(200).send(await db.updateObjectById<Team>(Collections.Teams, new ObjectId(data.teamId), team));
            
        },

        "handleRequest": async (req, res, {db, data}) => {
            // {
            //     accept
            //     userId
            //     teamId
            // }
            
            let team = await db.findObjectById<Team>(Collections.Teams, new ObjectId(data.teamId));
            let user = await db.findObjectById<User>(Collections.Users, new ObjectId(data.userId));

            team.requests.splice(team.requests.indexOf(data.userId), 1);

            if(data.accept) {
                team.users.push(data.userId);
                team.scouters.push(data.userId);

                user.teams.push(data.teamId);
            }


            await db.updateObjectById<User>(Collections.Users, new ObjectId(data.userId), user);
            await db.updateObjectById<Team>(Collections.Teams, new ObjectId(data.teamId), team)

            return res.status(200).send(team); 
        },
        
        // tba shit

        "teamAutofill": async (req, res, {tba, data}) => {
            // {
            //     number
            // }
            return res.status(200).send(await tba.getTeamAutofillData(data.number));
        },

        "competitionAutofill": async (req, res, {tba, data}) => {
            // {
            //     tbaId
            // }
            return res.status(200).send(await tba.getCompetitionAutofillData(data.tbaId));
        },

        "competitionMatches": async (req, res, {tba, data}) => {
            // {
            //     tbaId
            // }
            return res.status(200).send(await tba.getCompetitionMatches(data.tbaId));
        },

        "matchAutofill": async (req, res, {tba, data}) => {
            // {
            //    tbaId
            // }
            return res.status(200).send(await tba.getMatchAutofillData(data.tbaId));
        },


        // creation
        "createTeam": async (req, res, {db, data}) => {
            // {
            //     number
            //     tbaId?
            //     name, 
            //     creator
            // }
            const newTeamObj = new Team(data.name, await GenerateSlug(Collections.Teams, data.name), data?.tbaId, data.number, [data.creator], [data.creator], [data.creator]);
            const team = await db.addObject<Team>(Collections.Teams, newTeamObj);

            var user = await db.findObjectById<User>(Collections.Users, new ObjectId(data.creator));
            user.teams.push(team._id!);
            user.owner.push(team._id!);

            await db.updateObjectById(Collections.Users, new ObjectId(user._id), user);

            if(process.env.FILL_TEAMS) {
                fillTeamWithFakeUsers(20, team._id);
            }
            

            return res.status(200).send(team);
        },

        // NEEDS TO BE ADDED TO TEAM DUMBASS
        "createSeason": async (req, res, {db, data}) => {
            // {
            //     year
            //     name
            //     teamId;
            // }
            var season = await db.addObject<Season>(Collections.Seasons, new Season(data.name, await GenerateSlug(Collections.Seasons, data.name), data.year));
            var team = await db.findObjectById<Team>(Collections.Teams, new ObjectId(data.teamId));
            team.seasons = [...team.seasons, String(season._id)];

            await db.updateObjectById(Collections.Teams, new ObjectId(data.teamId), team);
        
            return res.status(200).send(season);
        },

        "createForm": async (req, res, {db, data}) => {
            // {
            //     name
            //     seasonId
            //     data
            // }
            
            const form = await db.addObject<Form>(Collections.Forms, new Form(data.name, data.data));
            const season = await db.findObjectById<Season>(Collections.Seasons, new ObjectId(data.seasonId));

            season.forms.push(String(form._id));
            await db.updateObjectById(Collections.Seasons, new ObjectId(season._id), {forms: season.forms})
        
            return res.status(200).send(form);
        },

        "createCompetiton": async (req, res, {db, data}) => {
            // {
            //     tbaId?
            //     start
            //     end
            //     name
            //     seasonId
            // }
            var comp = await db.addObject<Competition>(Collections.Competitions, new Competition(data.name, await GenerateSlug(Collections.Competitions, data.name), data.tbaId, data.start, data.end));
            // update seaason too $$$$$$$

            var season = await db.findObjectById<Season>(Collections.Seasons, new ObjectId(data.seasonId));
            console.log(season)
            season.competitions = [...season.competitions, String(comp._id)]

            await db.updateObjectById(Collections.Seasons, new ObjectId(season._id), season);

            return res.status(200).send(comp);
        },

        "createMatch": async (req, res, {db, data}) => {
            // {
            //     tbaId?
            //     number
            //     time
            //     type
            // }
            var match = await db.addObject<Match>(Collections.Matches, new Match(data.number, await GenerateSlug(Collections.Matches, data.number.toString()), data.tbaId, data.time, data.type, [], []));
            return res.status(200).send(match);
        },


        "searchCompetitionByName": async (req, res, {tba, data}) => {
            // {
            //    name
            // }
            return res.status(200).send(await tba.searchCompetitionByName(data.name))
        }


    }
}