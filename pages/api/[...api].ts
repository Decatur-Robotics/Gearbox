import ClientApi from "@/lib/api/ClientApi";
import ServerApi from "@/lib/api/ServerApi";
import { NextApiRequest, NextApiResponse } from "next";

const api = new ServerApi(new ClientApi());

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  api.handle(req, res);
}

export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};
