import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mockClient } from "aws-sdk-client-mock";
import { handler } from "../lambda/importProductsFile";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const mockSignedUrl = "https://mock.s3.amazonaws.com/test";

jest.mock("@aws-sdk/s3-request-presigner");
const getSignedUrlMock = getSignedUrl as jest.MockedFunction<
  typeof getSignedUrl
>;
getSignedUrlMock.mockImplementation(() => Promise.resolve(mockSignedUrl));

const validEvent = {
  queryStringParameters: {
    name: "test",
  },
} as unknown as APIGatewayProxyEvent;

describe("Import products file lambda", () => {
  beforeAll(() => {
    const s3Mock = mockClient(S3Client);
    s3Mock
      .on(PutObjectCommand, { Bucket: "testBucket", Key: "test.csv" })
      .resolves({});
  });

  it("should return 200 with signed url", async () => {
    const response = await handler(validEvent);

    expect(response.statusCode).toBe(200);

    const body = JSON.parse(response.body);
    expect(body).toBe(mockSignedUrl);
  });

  it("should return 400 if no name is provided", async () => {
    const invalidEvent = {
      queryStringParameters: {},
    } as unknown as APIGatewayProxyEvent;

    const response = await handler(invalidEvent);

    expect(response.statusCode).toBe(400);

    const body = JSON.parse(response.body);
    expect(body).toEqual({ message: "Missing name parameter" });
  });

  it("should return 500 in case of unexpected error", async () => {
    const errorMessage = "test error";
    getSignedUrlMock.mockImplementationOnce(() =>
      Promise.reject(new Error(errorMessage))
    );

    const response = await handler(validEvent);

    expect(response.statusCode).toBe(500);

    const body = JSON.parse(response.body);
    expect(body).toEqual({ message: errorMessage });
  });
});
