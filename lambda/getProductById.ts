import { buildResponse } from "../utils/responseBuilder";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent } from "aws-lambda";

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamo);

const getItem = async (tableName: string, key: string, value: string) => {
  const data = await docClient.send(
    new GetCommand({ TableName: tableName, Key: { [key]: value } })
  );
  return data.Item;
};

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log(
    "incoming request to get product by id with agrumens: ",
    JSON.stringify(event.pathParameters)
  );

  const productId = event.pathParameters?.productId;

  if (!productId)
    return buildResponse(400, { message: "productId is required" });

  try {
    const product = await getItem(
      process.env.DYNAMODB_PRODUCTS_TABLE!,
      "id",
      productId
    );

    if (!product) {
      return buildResponse(404, {
        message: "Product not found",
      });
    }

    const stock = await getItem(
      process.env.DYNAMODB_STOCKS_TABLE!,
      "product_id",
      productId
    );

    if (!stock) {
      return buildResponse(404, {
        message: "Stock not found",
      });
    }

    const response = buildResponse(200, { ...product, count: stock.count });
    return response;
  } catch (error) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
