import { buildResponse } from "../utils/responseBuilder";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const dynamo = new DynamoDBClient({ region: process.env.PRODUCT_AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamo);

const scan = async (tableName: string) => {
  const data = await docClient.send(new ScanCommand({ TableName: tableName }));
  return data.Items;
};

export const handler = async () => {
  console.log("incoming request to get products list");
  try {
    const products = await scan(process.env.DYNAMODB_PRODUCTS_TABLE!);
    const stocks = await scan(process.env.DYNAMODB_STOCKS_TABLE!);

    if (!stocks) throw new Error("No stocks found");

    const stocksMap = new Map(
      stocks.map((item) => [item.product_id, item.count])
    );

    if (!products) throw new Error("No products found");

    const productsWithStocks = products.map((product) => ({
      ...product,
      count: stocksMap.get(product.id),
    }));

    return buildResponse(200, productsWithStocks);
  } catch (error) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
