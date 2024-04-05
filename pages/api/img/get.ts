import { NextApiRequest, NextApiResponse } from "next";
import * as fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const filename = req.query.filename;

    if (!filename) return res.send({ status: 400, message: "Invalid Request" });

    res.writeHead(200, { "content-type": "image/*" });
    var s = fs.createReadStream(process.env.IMAGE_UPLOAD_DIR + `/${filename}`, {
      highWaterMark: 256 * 1024,
    });
    s.on("open", function () {
      s.pipe(res);
    });
    s.on("error", function () {
      res.send({ status: 404, message: "File Not Found" });
    });
  } else {
    return res.send({ status: 400, message: "Invalid Request" });
  }
}
