import { NextApiRequest, NextApiResponse } from "next";

export type ApiRoute<TArgs extends Array<any>, TReturn, TDependencies> = {
  (...args: TArgs): Promise<TReturn>;
  (req: NextApiRequest, res: NextApiResponse, deps: TDependencies, args: TArgs): TReturn;
}

const route: ApiRoute<[string, number], string, {}> = {
  (name, number) => {
    return Promise.resolve(`Hello, ${name} ${number}!`);
  }
}

route("hello", 1).then(console.log);

/**
 * ApiRoute has 2 call signatures:
 * - (args): client method
 *    - Needs to be populated with full path
 * - (req, res, deps, args): server method
 * 
 * ApiSegment has a fields that are ApiRoutes
 * 
 * ServerApiManager has a root ApiSegment
 */