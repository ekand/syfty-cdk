import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";

import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class SyftyCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const assetsBucket = new s3.Bucket(this, "SyftyLandingPageBucket", {
      websiteIndexDocument: "index.html",
      publicReadAccess: true,
    });

    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset("./website-dist")],
      destinationBucket: assetsBucket,
    });

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Certificate",
      // found using aws acm list-certificates --region us-east-1
      "arn:aws:acm:us-east-1:212702451742:certificate/79877676-939f-4886-8409-2de106f55da9"
    );

    // create a cloudfront distribution
    const cf = new cloudfront.Distribution(
      this,
      "SyftyLandingPageDistribution",
      {
        defaultBehavior: { origin: new origins.S3Origin(assetsBucket) },
        domainNames: ["syfty.net"],
        certificate,
      }
    );

    new cdk.CfnOutput(this, "SyftyDistributionID", {
      value: cf.distributionId,
      description: "The id of the distribution",
      exportName: "SyftyDistributionID",
    });

    new cdk.CfnOutput(this, "SyftyDistributionDomainName", {
      value: cf.distributionDomainName,
      description: "The domain name of the distribution",
      exportName: "SyftyDistributionDomainName",
    });

    // Create a new DynamoDB table
    const table = new dynamodb.Table(this, "SyftyEmailsTable", {
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      tableName: "syfty-emails-table",
    });

    // Create a new IAM role with DynamoDB read permissions
    const role = new iam.Role(this, "SyftyLambdaRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });
    table.grantReadWriteData(role);
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        resources: ["arn:aws:logs:*:*:*"],
      })
    );

    // Create a new Lambda function
    const signUpHandler = new lambda.Function(this, "signUpHandler", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset("lambda"),
      handler: "signup_handler.lambda_handler",
      role: role,
    });

    // Create a new API Gateway REST API
    const api = new apigateway.RestApi(this, "'SignUpEndpoint'", {
      restApiName: "'SignUp Endpoint'",
      description: "Saves Syfty Email Signups to a database",
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
      },
    });

    // Create a new resource and method for the API Gateway
    const visits = api.root.addResource("email");
    const postintegration = new apigateway.LambdaIntegration(signUpHandler, {
      requestTemplates: {
        "application/json": '{ "email": "$input.params(\'email\')" }',
      },
      passthroughBehavior: apigw.PassthroughBehavior.WHEN_NO_TEMPLATES,
      integrationResponses: [{ statusCode: "200" }],
    });
    visits.addMethod("POST", postintegration);

    new cdk.CfnOutput(this, "SyftyEmailSignupAPIDomainName", {
      value: api.url,
      description: "The domain name of the email signup api",
      exportName: "SyftyEmailSignupAPIDomainName",
    });
  }
}
