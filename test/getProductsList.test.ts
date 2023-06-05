import { handler } from "../lambda/getProductsList";
import { buildResponse } from "../utils/responseBuilder";
import bikes from "../data/bikes.json";

describe("getProductsList lambda function", () => {
  it("should return a successful response", async () => {
    const expectedResponse = buildResponse(200, bikes);

    const response = await handler({});

    expect(response).toEqual(expectedResponse);
  });
});
