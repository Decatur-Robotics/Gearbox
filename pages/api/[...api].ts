
import { API } from '@/lib/API'
import { NextApiRequest, NextApiResponse } from 'next'

const api = new API.Handler(API.Routes);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    api.handleRequest(req, res);
}

export const config = {
    api: {
      bodyParser: true,
      externalResolver: true,
    }
};