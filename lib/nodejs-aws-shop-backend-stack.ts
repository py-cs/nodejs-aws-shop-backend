import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path from "path";

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
  },
};

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new NodejsFunction(this, "getProductsList", {
      ...sharedLambdaProps,
      functionName: "getProductsList",
      entry: path.join(__dirname, "..", "lambda", "getProductsList.ts"),
    });

    const getProductById = new NodejsFunction(this, "getProductById", {
      ...sharedLambdaProps,
      functionName: "getProductById",
      entry: path.join(__dirname, "..", "lambda", "getProductById.ts"),
    });

    const api = new apiGateway.RestApi(this, "ProductsApiGateway", {
      restApiName: "Products API",
      defaultCorsPreflightOptions: {
        allowOrigins: apiGateway.Cors.ALL_ORIGINS,
        allowMethods: apiGateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
        allowCredentials: true,
      },
    });

    const productsList = api.root.addResource("products");
    productsList.addMethod(
      "GET",
      new apiGateway.LambdaIntegration(getProductsList)
    );

    productsList
      .addResource("{productId}")
      .addMethod("GET", new apiGateway.LambdaIntegration(getProductById));
  }
}
