import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3notificaitions from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { env } from "../env";
import path = require("path");
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import { Folders } from "../utils/constants";

enum Lambdas {
  importFileParser = "importFileParser",
  importProductsFile = "importProductsFile",
}

const { IMPORT_AWS_REGION, BUCKET_NAME } = env;

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    IMPORT_AWS_REGION,
    BUCKET_NAME,
  },
  bundling: {
    externalModules: [
      "aws-lambda",
      "stream",
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
    ],
  },
};

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const importQueueArn = cdk.Fn.importValue("ImportQueueArn");

    const importQueue = sqs.Queue.fromQueueArn(
      this,
      "ImportQueue",
      importQueueArn
    );

    const bucket = new s3.Bucket(this, "ImportBucket", {
      bucketName: BUCKET_NAME,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedOrigins: ["*"],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ["*"],
          exposedHeaders: [],
        },
      ],
    });

    const importProductsFile = new NodejsFunction(
      this,
      Lambdas.importProductsFile,
      {
        ...sharedLambdaProps,
        functionName: Lambdas.importProductsFile,
        entry: path.join(
          __dirname,
          "..",
          "lambda",
          `${Lambdas.importProductsFile}.ts`
        ),
      }
    );

    const importFileParser = new NodejsFunction(
      this,
      Lambdas.importFileParser,
      {
        ...sharedLambdaProps,
        environment: {
          ...sharedLambdaProps.environment,
          IMPORT_QUEUE_URL: importQueue.queueUrl,
        },
        functionName: Lambdas.importFileParser,
        entry: path.join(
          __dirname,
          "..",
          "lambda",
          `${Lambdas.importFileParser}.ts`
        ),
      }
    );

    importQueue.grantSendMessages(importFileParser);

    const api = new apiGateway.RestApi(this, "ImportApiGateway", {
      restApiName: "Import API",
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS,
        allowMethods: apiGateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
        allowCredentials: true,
      },
    });

    api.root
      .addResource("import")
      .addMethod("GET", new apiGateway.LambdaIntegration(importProductsFile), {
        requestParameters: { "method.request.querystring.name": true },
      });

    bucket.grantReadWrite(importProductsFile);
    bucket.grantReadWrite(importFileParser);
    bucket.grantDelete(importFileParser);

    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notificaitions.LambdaDestination(importFileParser),
      { prefix: Folders.UPLOADED }
    );
  }
}
