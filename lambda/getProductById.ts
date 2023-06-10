import { buildResponse } from "../utils/responseBuilder";
import bikes from "../data/products.json";

export const handler = async (event: any) => {
  const { productId } = event.pathParameters;
  try {
    const product = bikes.find((bike) => bike.id === productId);

    if (!product) {
      return buildResponse(404, {
        message: "Product not found",
      });
    }

    const response = buildResponse(200, product);
    return response;
  } catch (error) {
    return buildResponse(500, {
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
