import { NextApiRequest, NextApiResponse } from "next";
import { OmitCallSignature } from "@/lib/Types";

/**
 * @tested_by tests/lib/client/ApiLib.test.ts
 */
namespace ApiLib {
  export type Route<TArgs extends Array<any>, TReturn, TDependencies> = {
    subUrl: string;
    (...args: TArgs): Promise<TReturn>;
    handler: (req: NextApiRequest, res: NextApiResponse, deps: TDependencies, args: TArgs) => TReturn;
  }
  
  export enum RequestMethod {
    POST = "POST",
    GET = "GET",
  }

  export async function request(
    subUrl: string,
    body: any,
    method: RequestMethod = RequestMethod.POST
  ) {
    const rawResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + subUrl, {
      method: method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    
    const res = await rawResponse.json();

    if (res.error) {
      if (res.error === "Unauthorized") {
        alert(`Unauthorized API request: ${subUrl}. If this is an error, please contact the developers.`);
      }
      throw new Error(`${subUrl}: ${res.error}`);
    }

    return res;
  }

  /**
   * There's no easy one-liner to create a function with properties while maintaining typing, so I made this shortcut
   */
  export function createRoute<TArgs extends Array<any>, TReturn, TDependencies>(
    server: Omit<OmitCallSignature<Route<TArgs, TReturn, TDependencies>>, "subUrl">,
    clientHandler?: (...args: TArgs) => Promise<TReturn>
  ): Route<TArgs, TReturn, TDependencies> {
    return Object.assign(clientHandler ?? { subUrl: "newRoute" }, server) as any;
  }

  export type Segment<TDependencies> = {
    [route: string]: Segment<TDependencies> | Route<any, any, TDependencies>;
  }

  export abstract class ClientApiTemplate {
    [route: string]: any;

    private initSegment(segment: Segment<any>, subUrl: string) {
      for (const [key, value] of Object.entries(segment)) {
        if (typeof value === "function") {
          value.subUrl = subUrl + "/" + key;
        }  else if ((value as unknown as Route<any, any, any>).subUrl === "newRoute") {
          const route = value as unknown as Route<any, any, any>;
          route.subUrl = subUrl + "/" + key;

          segment[key] = createRoute(route, (...args: any[]) => request(route.subUrl, args));
        } else if (typeof value === "object") {
          this.initSegment(value, subUrl + "/" + key);
        }
      }
    }

    protected init() {
      this.initSegment(this as Segment<any>, "");
    }

    /**
     * You need to pass false in subclasses and then call this.init()
     * @param init Whether to call init() on construction. Pass false if calling super()
     */
    constructor(init = true) {
      if (init) {
        this.init();
      }
    }
  }
}

export default ApiLib;

const segment = {
  route: ApiLib.createRoute(
    {
      handler: (req, res, deps, [name, number]) => {
        return `Hello, ${name} ${number}!`;
      },
    },
    (name: string, number: number) => {
      return Promise.resolve(`Hello, ${name} ${number}!`);
    }
  )
};

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