import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config();

const PRODUCT_AWS_REGION = process.env.PRODUCT_AWS_REGION!;
const DYNAMODB_PRODUCTS_TABLE = process.env.DYNAMODB_PRODUCTS_TABLE!;
const DYNAMODB_STOCKS_TABLE = process.env.DYNAMODB_STOCKS_TABLE!;

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION,
    DYNAMODB_PRODUCTS_TABLE,
    DYNAMODB_STOCKS_TABLE,
  },
};

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { account } = cdk.Stack.of(this);

    const dynamoDbAccessRole = new iam.Role(this, "dynamoDBAccessRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      inlinePolicies: {
        dynamoDBAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                "dynamodb:Scan",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
              ],
              resources: [
                `arn:aws:dynamodb:${PRODUCT_AWS_REGION}:${account}:table/${DYNAMODB_PRODUCTS_TABLE}`,
                `arn:aws:dynamodb:${PRODUCT_AWS_REGION}:${account}:table/${DYNAMODB_STOCKS_TABLE}`,
              ],
            }),
          ],
        }),
      },
    });

    const getProductsList = new NodejsFunction(this, "getProductsList", {
      ...sharedLambdaProps,
      functionName: "getProductsList",
      entry: path.join(__dirname, "..", "lambda", "getProductsList.ts"),
      role: dynamoDbAccessRole,
    });

    const getProductById = new NodejsFunction(this, "getProductById", {
      ...sharedLambdaProps,
      functionName: "getProductById",
      entry: path.join(__dirname, "..", "lambda", "getProductById.ts"),
      role: dynamoDbAccessRole,
    });

    const createProduct = new NodejsFunction(this, "createProduct", {
      ...sharedLambdaProps,
      functionName: "createProduct",
      entry: path.join(__dirname, "..", "lambda", "createProduct.ts"),
      role: dynamoDbAccessRole,
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

    productsList.addMethod(
      "POST",
      new apiGateway.LambdaIntegration(createProduct)
    );

    productsList
      .addResource("{productId}")
      .addMethod("GET", new apiGateway.LambdaIntegration(getProductById));
  }
}
