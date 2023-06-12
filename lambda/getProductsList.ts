import { db } from "../utils/db";
import { buildResponse } from "../utils/responseBuilder";

export const handler = async () => {
  console.log("incoming request to get products list");
  try {
    const productsData = await db.query.products.findMany({
      with: { stocks: { columns: { count: true } } },
    });

    return buildResponse(200, productsData);
  } catch (error) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unexpected error",
    });
  }
};
