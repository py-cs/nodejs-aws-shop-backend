import { buildResponse } from "../utils/responseBuilder";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { productSchema } from "../utils/productSchema";
import { randomUUID } from "crypto";

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamo);

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) return buildResponse(401, { message: "Invalid product" });
  const createProductDTO = JSON.parse(event.body);

  console.log(
    "incoming request to create product with parameters: ",
    JSON.stringify(createProductDTO)
  );

  let productWithStock;

  try {
    productWithStock = await productSchema.validate(createProductDTO);
  } catch (error: unknown) {
    return buildResponse(400, { message: "Invalid product" });
  }

  const { count, ...productData } = productWithStock;
  const id = randomUUID();
  const product = { ...productData, id };
  const stock = { product_id: id, count };

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: process.env.DYNAMODB_PRODUCTS_TABLE!,
              Item: product,
            },
          },
          {
            Put: {
              TableName: process.env.DYNAMODB_STOCKS_TABLE!,
              Item: stock,
            },
          },
        ],
      })
    );

    return buildResponse(201, { ...productWithStock, id });
  } catch (error: unknown) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
