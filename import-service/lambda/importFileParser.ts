import { buildResponse } from "../utils/responseBuilder";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  S3Client,
  _Object,
} from "@aws-sdk/client-s3";
import { PassThrough, Readable } from "stream";
import { S3Event } from "aws-lambda";
import csv from "csv-parser";

export const handler = async (event: S3Event) => {
  try {
    const records = event.Records;
    if (!records.length) throw new Error("No records found");

    const fileName = records[0].s3.object.key;

    const client = new S3Client({ region: process.env.IMPORT_AWS_REGION });
    const bucketName = process.env.BUCKET_NAME;

    const file = await client.send(
      new GetObjectCommand({ Bucket: bucketName, Key: fileName })
    );

    const body = file.Body;

    if (!(body instanceof Readable)) {
      throw new Error("Failed to read file");
    }

    await new Promise((resolve) => {
      body
        .pipe(new PassThrough())
        .pipe(csv())
        .on("data", console.log)
        .on("end", async () => {
          console.log("Finished reading");

          await client.send(
            new CopyObjectCommand({
              Bucket: bucketName,
              CopySource: `${bucketName}/${fileName}`,
              Key: fileName.replace("uploaded", "parsed"),
            })
          );
          console.log("Copied file to /parsed");

          await client.send(
            new DeleteObjectCommand({ Bucket: bucketName, Key: fileName })
          );
          console.log("Deleted source file");

          resolve(null);
        });
    });

    return buildResponse(200, "Done");
  } catch (error) {
    console.error(error);

    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
