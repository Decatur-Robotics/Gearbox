import { NextApiRequest, NextApiResponse } from "next";
import Auth from "@/lib/Auth";

export default (req: NextApiRequest, res: NextApiResponse<any>) =>
	Auth(req, res);
