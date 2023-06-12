import { APIGatewayProxyEvent } from "aws-lambda";
import { buildResponse } from "../utils/responseBuilder";
import { db } from "../utils/db";

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log(
    "incoming request to get product by id with agrumens: ",
    JSON.stringify(event.pathParameters)
  );

  const productId = Number(event.pathParameters?.productId);

  if (!productId)
    return buildResponse(400, { message: "productId is required" });

  try {
    const productData = await db.query.products.findFirst({
      where: (products, { eq }) => eq(products.id, productId),
      with: { stocks: { columns: { count: true } } },
    });

    return buildResponse(200, productData);
  } catch (error) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
