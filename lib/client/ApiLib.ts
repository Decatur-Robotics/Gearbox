import { NextApiRequest, NextApiResponse } from "next";

export class ApiSegment<TRouteDependencies> {
  [path: string]: ApiRoute<TRouteDependencies, any[], any> | ApiSegment<TRouteDependencies>;

  handle(req: NextApiRequest, res: NextApiResponse, deps: TRouteDependencies, args: any[]): Promise<void> {
    fo
  }
}

export interface ApiRoute<TRouteDependencies, TClientParams extends Array<any>, TReturn> {
  path: string;

  (...args: TClientParams): Promise<TReturn>;
  (req: NextApiRequest, res: NextApiResponse, deps: TRouteDependencies, args: TClientParams): Promise<void>;
}

/**
 * ApiSegment has 2 call signatures:
 * - (args): client method
 *  - Needs to be populated with full path
 * - (req, res, deps, args): server method
 */