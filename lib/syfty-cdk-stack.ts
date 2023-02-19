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
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
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
      "arn:aws:acm:us-east-1:212702451742:certificate/bce47da2-4106-4a13-bff7-3e0d723eb861"
    );

    // create a cloudfront distribution
    const cf = new cloudfront.Distribution(
      this,
      "SyftyLandingPageDistribution",
      {
        defaultBehavior: {
          origin: new origins.S3Origin(assetsBucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        domainNames: ["syfty.link"],
        certificate,
      }
    );

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "syftydotlink-zone",
      {
        zoneName: "syfty.link",
        hostedZoneId: "Z04818373AY4HWJSPONYH",
      }
    );

    new route53.ARecord(this, "CDNARecord", {
      zone,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(cf)),
    });

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

    // // Create an RDS instance for Syfty core

    // // Define the VPC for the RDS database
    // const vpc = new ec2.Vpc(this, "MyVPC", {
    //   ipAddresses: ec2.IpAddresses.cidr("10.0.0.0/16"),
    //   maxAzs: 2,
    // });

    // // Define the Security Group for the RDS database
    // const dbSecurityGroup = new ec2.SecurityGroup(this, "DBSecurityGroup", {
    //   vpc,
    //   allowAllOutbound: true,
    //   description: "Security group for the RDS database",
    // });

    // dbSecurityGroup.addIngressRule(
    //   ec2.Peer.ipv4("104.153.230.42/32"),
    //   ec2.Port.tcp(3306),
    //   "allow postgres access"
    // );

    // // Define the RDS database
    // const database = new rds.DatabaseInstance(this, "MyDatabase", {
    //   engine: rds.DatabaseInstanceEngine.mysql({
    //     version: rds.MysqlEngineVersion.VER_8_0,
    //   }),
    //   instanceType: ec2.InstanceType.of(
    //     ec2.InstanceClass.BURSTABLE2,
    //     ec2.InstanceSize.MICRO
    //   ),
    //   vpc,
    //   securityGroups: [dbSecurityGroup],
    //   credentials: rds.Credentials.fromPassword(
    //     "username",
    //     cdk.SecretValue.unsafePlainText("password")
    //   ),
    //   allocatedStorage: 10,
    //   publiclyAccessible: true,
    // });

    // // Output the database endpoint and port for testing purposes
    // new cdk.CfnOutput(this, "RDSDatabaseEndpoint", {
    //   value: database.dbInstanceEndpointAddress,
    // });
    // new cdk.CfnOutput(this, "RDSDatabasePort", {
    //   value: database.dbInstanceEndpointPort,
    // });
  }
}
