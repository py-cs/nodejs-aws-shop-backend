import { buildResponse } from "../utils/responseBuilder";
import { APIGatewayProxyEvent } from "aws-lambda";
import { db } from "../utils/db";
import { productSchema } from "../utils/productSchema";
import { products, stocks } from "../utils/schema";

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

  try {
    const createdProduct = await db
      .insert(products)
      .values(productData)
      .returning();

    const createdStocks = await db
      .insert(stocks)
      .values({ count, product_id: createdProduct[0].id })
      .returning();

    return buildResponse(201, {
      ...createdProduct,
      count: createdStocks[0].count,
    });
  } catch (error: unknown) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
