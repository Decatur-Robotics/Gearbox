import { NextApiRequest, NextApiResponse } from "next";
import { Collections, GetDatabase, MongoDBInterface } from "./MongoDB";
import { TheBlueAlliance } from "./TheBlueAlliance";
import { Competition, Form, Match, Season, Team, User, Report } from "./Types";
import { GenerateSlug } from "./Utils";
import { ObjectId } from "mongodb";
import { fillTeamWithFakeUsers } from "./dev/FakeData";
import { AssignScoutersToCompetitionMatches } from "./CompetitionHandeling";
import { isAwaitExpression } from "typescript";
import { WebClient } from "@slack/web-api";

// WebClient instantiates a client that can call API methods
// When using Bolt, you can use either `app.client` or the `client` passed to listeners.

export namespace slackAPI {

    export const GearboxHeader = "gearbox-auth"
    type Route = (req: NextApiRequest, res: NextApiResponse, contents: {slackClient: WebClient, db: MongoDBInterface, data: any}) => Promise<void>;
    type RouteCollection = { [routeName: string]: Route};

    class Error {
        constructor(res: NextApiResponse, errorCode: number=500, description: string = "The server encountered an error while processing the request") {
            res.status(errorCode).send({"error": description})
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
            super(res, 401, "Please provide a valid 'Gearbox-Auth' Header Key")
        }
    }
    
    export class Handler {
        // feed routes as big object ot tjhe handler
        routes: RouteCollection;
        db: Promise<MongoDBInterface>;
        slackClient: WebClient
        basePath: string;
        
        constructor(apiRoutes: RouteCollection, base="/api/") {
            this.routes = apiRoutes;
            this.db = GetDatabase();
            this.basePath = base;
            this.slackClient = new WebClient();
        }

        async handleRequest(req: NextApiRequest, res: NextApiResponse) {
            
            if(!req.url) {
                new InvalidRequestError(res);
                return;
            }

            if(req.headers[GearboxHeader]?.toString() !== process.env.API_KEY) {
                const user = await (await this.db).findObjectById(Collections.Users, new ObjectId(req.headers[GearboxHeader]?.toString()));
                if(!user) {
                    new UnauthorizedError(res);
                }
            }

            var route = req.url.replace(this.basePath, "");
            
            if(route in this.routes) {
                this.routes[route](req, res, {slackClient:this.slackClient, db:await this.db, data:req.body});
            } else {
                new NotFoundError(res, route);
                return;
            }
        }
    }

    export const Routes: RouteCollection = {
        "remind" : async(req,res,{slackClient,data}) => {
            console.log("Attempting to post")
                await slackClient.chat.postMessage({
                  // The token you used to initialize your app
                  token: process.env.SLACK_KEY,
                  channel: 'C06GXSJP2QN',
                  text: data.message
                  // You could also use a blocks[] array to send richer content
                })
            console.log("Posted")
        },

        "setSlackId" : async(req,res,{db,data}) => {
            await db.updateObjectById<User>(Collections.Users, new ObjectId(data.userId), {slackId: data.slackId})
        }
    }
}