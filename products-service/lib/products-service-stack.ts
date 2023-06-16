import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apiGateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path from "path";
import { env } from "../env";

const { PRODUCTS_AWS_REGION, DYNAMODB_PRODUCTS_TABLE, DYNAMODB_STOCKS_TABLE } =
  env;

const sharedTableProps: Partial<dynamodb.TableProps> = {
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  tableClass: dynamodb.TableClass.STANDARD,
};

enum Lambdas {
  getProductsList = "getProductsList",
  getProductById = "getProductById",
  createProduct = "createProduct",
}

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCTS_AWS_REGION,
    DYNAMODB_PRODUCTS_TABLE,
    DYNAMODB_STOCKS_TABLE,
  },
  bundling: { externalModules: ["aws-sdk", "zod", "crypto"] },
};

export class ProductsServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const productsTable = new dynamodb.Table(this, "products", {
      ...sharedTableProps,
      partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
      tableName: DYNAMODB_PRODUCTS_TABLE,
    });

    const stocksTable = new dynamodb.Table(this, "stocks", {
      ...sharedTableProps,
      partitionKey: { name: "product_id", type: dynamodb.AttributeType.STRING },
      tableName: DYNAMODB_STOCKS_TABLE,
    });

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
              resources: [productsTable.tableArn, stocksTable.tableArn],
            }),
          ],
        }),
      },
    });

    const [getProductsList, getProductById, createProduct] = [
      Lambdas.getProductsList,
      Lambdas.getProductById,
      Lambdas.createProduct,
    ].map(
      (lambdaName) =>
        new NodejsFunction(this, lambdaName + "1", {
          ...sharedLambdaProps,
          functionName: lambdaName + "1",
          entry: path.join(__dirname, "..", "lambda", `${lambdaName}.ts`),
          role: dynamoDbAccessRole,
        })
    );

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
