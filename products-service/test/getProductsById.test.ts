import { handler } from "../lambda/getProductById";
import bikes from "../data/products.json";

describe("getProductsById lambda function", () => {
  it("should return 404 if product is not found", async () => {
    const event = {
      pathParameters: {
        productId: "non-existent-id",
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(response.body).toBe(
      JSON.stringify({
        message: "Product not found",
      })
    );
  });

  it("should return 200 with the product if found", async () => {
    const existingProductId = "1";
    const existingProduct = bikes.find((bike) => bike.id === existingProductId);

    const event = {
      pathParameters: {
        productId: existingProductId,
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe(JSON.stringify(existingProduct));
  });

  it("should return 500 status code and error message in case of unexpected error", async () => {
    const event = {
      pathParameters: {
        productId: "1",
      },
    };

    const errorMessage = "Unexpected error";

    jest.spyOn(bikes, "find").mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await handler(event);

    expect(response.statusCode).toBe(500);
    expect(response.body).toBeDefined();

    const responseBody = JSON.parse(response.body);
    expect(responseBody.message).toBe(errorMessage);
  });
});
