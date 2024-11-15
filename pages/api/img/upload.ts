import { NextApiRequest, NextApiResponse } from "next";
import { Formidable } from "formidable";
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
  if (req.method === "POST") {
    try {
      const form: any = await new Promise((resolve, reject) => {
        const form = new Formidable();
        form.parse(req, (err: any, fields: any, files: any) => {
          if (err) reject({ err });
          resolve({ fields, files });
        });
      });
      const files = form.files.files;
      const file = files[0];

      var filetype = file.mimetype.split("image/")[1];
      var filename = `/${file.newFilename}.${filetype}`;
      console.log(process.env.IMAGE_UPLOAD_DIR + filename);
      console.log(process.env.IMAGE_UPLOAD_DIR);

      var tempFile = fs.readFileSync(file.filepath, { encoding: "base64" });
      fs.writeFile(process.env.IMAGE_UPLOAD_DIR + filename, tempFile, (err) => {
        res.send({ status: 200, filename: filename });
      });
    } catch (e) {
      res.send({ status: 500, message: e });
    }
  } else {
    return res.send({ status: 400, message: "Invalid Request" });
  }
}
