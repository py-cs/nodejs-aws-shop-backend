import { buildResponse } from "../utils/responseBuilder";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";
import { productSchema } from "../utils/productSchema";
import { randomUUID } from "crypto";

const dynamo = new DynamoDBClient({ region: process.env.PRODUCTS_AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamo);

export const createProduct = async (createProductDTO: unknown) => {
  const productWithStock = productSchema.parse(createProductDTO);

  const { stock: count, ...productData } = productWithStock;
  const id = randomUUID();
  const product = { ...productData, id };
  const stock = { product_id: id, count };

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
  return { ...productWithStock, id };
};

export const handler = async (event: APIGatewayProxyEvent) => {
  if (!event.body) return buildResponse(400, { message: "Empty product data" });

  try {
    const createProductDTO = JSON.parse(event.body);
    const response = await createProduct(createProductDTO);
    return buildResponse(201, response);
  } catch (error: unknown) {
    return buildResponse(400, {
      message: "Invalid product",
    });
  }
};
