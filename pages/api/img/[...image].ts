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
  if (req.method === "GET") {
    var imageId = req.url?.split("/api/img/")[1];
    console.log(imageId);
    const db = await GetDatabase();
    //@ts-ignore
    const bucket = new GridFSBucket(db.db, { bucketName: "bucket" });
    const result = (
      await bucket.find({ _id: new ObjectId(imageId) }).toArray()
    )[0];

    if (!result) {
      res.send({ status: 404, message: "File Not Found" });
    }

    console.log(Object.keys(result));

    bucket.openDownloadStream(result._id).pipe(res);
  } else {
    return res.send({ status: 400, message: "Invalid Request" });
  }
}
