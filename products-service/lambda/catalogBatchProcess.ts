import { SQSEvent } from "aws-lambda";
import { createProduct } from "./createProduct";

export const handler = async (event: SQSEvent) => {
  const records = event.Records;

  for (const record of records) {
    console.log("body: ", record.body);
    const createProductDTO = JSON.parse(record.body);
    await createProduct(createProductDTO);
  }

  console.log("done");
};
