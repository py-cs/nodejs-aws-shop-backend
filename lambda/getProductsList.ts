import { buildResponse } from "../utils/responseBuilder";
import bikes from "../data/products.json";

export const handler = async (event: any) => {
  try {
    const response = buildResponse(200, bikes);
    return response;
  } catch (error) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
