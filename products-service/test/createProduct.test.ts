import { handler } from "../lambda/createProduct";
import { buildResponse } from "../utils/responseBuilder";

describe("Create product lambda", () => {
  it("should return 401 if event.body is falsy", async () => {
    const event = { body: null };
    const response = await handler(event as any);
    expect(response).toEqual(
      buildResponse(401, { message: "Invalid product" })
    );
  });

  it("should return 201 and created product if validation and DynamoDB operations succeed", async () => {
    const validDTO = {
      title: "Product title",
      description: "Product description",
      price: 100,
      count: 10,
    };

    const event = {
      body: JSON.stringify(validDTO),
    };
    const mockProductSchema = {
      validate: jest.fn().mockResolvedValueOnce(validDTO),
    };
    const mockDocClient = {
      send: jest.fn().mockResolvedValueOnce({}),
    };

    jest.mock("../utils/productSchema", () => ({
      productSchema: mockProductSchema,
    }));

    jest.mock("@aws-sdk/client-dynamodb", () => ({
      DynamoDBClient: jest.fn().mockImplementation(() => ({
        send: jest.fn().mockReturnValue({}),
      })),
    }));

    jest.mock("@aws-sdk/lib-dynamodb", () => ({
      DynamoDBDocumentClient: jest.fn().mockImplementation(() => ({
        from: jest.fn().mockReturnValue(mockDocClient),
      })),
      PutCommand: jest.fn(),
      TransactWriteCommand: jest.fn(),
    }));

    const response = await handler(event as any);

    expect(mockProductSchema.validate).toHaveBeenCalledWith(
      JSON.parse(event.body)
    );
    expect(mockDocClient.send).toHaveBeenCalledTimes(1);
    expect(response).toEqual(buildResponse(201));
  });

  it("should return 400 if product validation fails", async () => {
    const event = {
      body: JSON.stringify({
        title: "Invalid product",
      }),
    };
    const mockProductSchema = {
      validate: jest.fn().mockRejectedValueOnce(new Error("Validation error")),
    };

    jest.mock("../utils/productSchema", () => ({
      productSchema: mockProductSchema,
    }));

    const response = await handler(event as any);

    expect(mockProductSchema.validate).toHaveBeenCalledWith(
      JSON.parse(event.body)
    );
    expect(response).toEqual(
      buildResponse(400, { message: "Invalid product" })
    );
  });
});
