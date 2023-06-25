import { buildResponse } from "../utils/responseBuilder";
import { APIGatewayProxyEvent } from "aws-lambda";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Folders } from "../utils/constants";

export const handler = async (event: APIGatewayProxyEvent) => {
  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return buildResponse(400, {
      message: "Missing name parameter",
    });
  }

  const client = new S3Client({ region: process.env.IMPORT_AWS_REGION });
  const bucketName = process.env.BUCKET_NAME;
  const key = `${Folders.UPLOADED}/${fileName}`;

  const putCommand = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const url = await getSignedUrl(client, putCommand);
    return buildResponse(200, url);
  } catch (error) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
