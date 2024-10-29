import { NextApiRequest, NextApiResponse } from "next";
import { User } from "../Types";
import ApiLib from "./ApiLib";

namespace AccessLevels {  
  export function AlwaysAuthorized() {
    return Promise.resolve({ authorized: true, authData: undefined });
  }

  export async function AlwaysAuthorizedIfSignedIn(req: NextApiRequest, res: ApiLib.ApiResponse<any>, { userPromise }: { userPromise: Promise<User | undefined> }) {
    return { authorized: (await userPromise) !== undefined, authData: undefined };
  }
}

export default AccessLevels;