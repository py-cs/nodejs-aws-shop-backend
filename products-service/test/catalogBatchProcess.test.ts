import { handler } from "../lambda/catalogBatchProcess";
import { SQSEvent } from "aws-lambda";
import { createProduct } from "../lambda/createProduct";
import { mockClient } from "aws-sdk-client-mock";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import "aws-sdk-client-mock-jest";

jest.mock("../lambda/createProduct");
const createProductMock = createProduct as jest.MockedFunction<
  typeof createProduct
>;

const snsMock = mockClient(SNSClient as any);
snsMock.onAnyCommand().resolves({});

const mockProduct: Awaited<ReturnType<typeof createProduct>> = {
  title: "test title",
  description: "test description",
  price: 100,
  count: 1,
  id: "67aa6410-0d84-48c9-9171-70e28d4aeb8e",
};

const { id, ...createProductDTO } = mockProduct;

const mockEvent = {
  Records: [
    {
      body: JSON.stringify(createProductDTO),
    },
  ],
};

describe("catalogBatchProcess lambda", () => {
  it("should call createProduct", async () => {
    const result = await handler(mockEvent as SQSEvent);
    expect(createProductMock).toBeCalledWith(createProductDTO);
  });

  it("should send message to SNS", async () => {
    await handler(mockEvent as SQSEvent);
    expect(snsMock).toHaveReceivedCommand(PublishCommand as any);
  });
});
