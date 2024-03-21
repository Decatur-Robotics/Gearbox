import { NextApiRequest, NextApiResponse } from "next";
import { GetDatabase } from "@/lib/MongoDB";
import { GridFSBucket, ObjectId } from "mongodb";
import { SerializeDatabaseObject } from "@/lib/UrlResolver";
import { useRouter } from "next/router";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("Received image request");
  if (req.method === "GET") {
    const router = useRouter();
    var filename = router.query.slug as string;
    if (!filename) return res.send({ status: 400, message: "Invalid Request" });
    const db = await GetDatabase();
    //@ts-ignore
    const bucket = new GridFSBucket(db.db, { bucketName: "bucket" });
    console.log(filename);
    try {
      // errors here
      bucket.openDownloadStreamByName(filename).pipe(res);
    } catch (e) {
      console.log(":error");
      return res.send({ status: 400, message: e });
    }
  } else {
    return res.send({ status: 400, message: "Invalid Request" });
  }
}
