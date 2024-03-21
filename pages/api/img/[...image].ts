import { NextApiRequest, NextApiResponse } from "next";
import { GetDatabase } from "@/lib/MongoDB";
import { GridFSBucket, ObjectId } from "mongodb";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.warn("invocked");
  if (req.method === "GET") {
    console.warn("GET");
    var filename = req.url?.split("/api/img/")[1];
    if (!filename) return res.send({ status: 400, message: "Invalid Request" });
    const db = await GetDatabase();
    //@ts-ignore
    const bucket = new GridFSBucket(db.db, { bucketName: "bucket" });
    console.log(filename);
    try {
      console.log("filing");
      bucket.openDownloadStreamByName(filename).pipe(res);
    } catch (e) {
      console.log(":error");
      return res.send({ status: 400, message: e });
    }
  } else {
    return res.send({ status: 400, message: "Invalid Request" });
  }
}
