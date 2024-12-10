import { NextApiRequest, NextApiResponse } from "next";
import Auth from "@/lib/Auth";

function getAuth(req: NextApiRequest, res: NextApiResponse<any>) {
	return Auth(req, res);
}

export default getAuth;
