import { SQSEvent } from "aws-lambda";
import { createProduct } from "./createProduct";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: process.env.PRODUCTS_AWS_REGION });

export const handler = async (event: SQSEvent) => {
  const records = event.Records;

  for (const record of records) {
    const createProductDTO = JSON.parse(record.body);

    const createdProduct = await createProduct(createProductDTO);

    await sns.send(
      new PublishCommand({
        Subject: "New product was created",
        Message: JSON.stringify(createdProduct),
        TopicArn: process.env.IMPORT_PRODUCT_TOPIC_ARN,
        MessageAttributes: {
          count: {
            DataType: "Number",
            StringValue: createProductDTO.count.toString(),
          },
        },
      })
    );
  }
};
