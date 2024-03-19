import { NextApiRequest, NextApiResponse } from "next";

import { Formidable } from "formidable";
import { GetDatabase } from "@/lib/MongoDB";
import { createReadStream } from "fs";
import { GridFSBucket, ObjectId } from "mongodb";
import { API } from "@/lib/API";

export const config = {
    api: {
      bodyParser: false
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
      
        try {
          if(req.headers[API.GearboxHeader]?.toString() !== process.env.API_KEY) {
            res.send({status: 400, message: "Invalid Request"})
          }
          const data:any = await new Promise((resolve, reject) => {
            const form = new Formidable();
        
            form.parse(req, (err: any, fields: any, files: any) => {
              if (err) reject({ err })
              resolve({ err, fields, files })
            }) 
          })
        
          const db = await GetDatabase();
          //@ts-ignore
          const bucket = new GridFSBucket(db.db, { bucketName: 'bucket' });

          const file = data.files.files[0] as any;
          if(!bucket) {
              console.log("fuck")
              return;
          }

          const filename = new ObjectId().toString();

          const c = createReadStream(file.filepath).pipe(bucket.openUploadStream(filename, {chunkSizeBytes:1048576, metadata:{}}));
          return res.send({ status: 200, filename: filename }); 
        } catch(e) {
          res.send({status: 500, message: e});
        }
        
    } else {
      return res.send({ status: 400, message: 'Invalid Request' });
    }

   
    
}
