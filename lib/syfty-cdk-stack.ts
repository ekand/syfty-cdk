import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";

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

    const cf = new cloudfront.Distribution(
      this,
      "SyftyLandingPageDistribution",
      {
        defaultBehavior: { origin: new origins.S3Origin(assetsBucket) },
        // domainNames: ["syfty.net"],
        // certificate,
      }
    );

    new cdk.CfnOutput(this, "distributionID", {
      value: cf.distributionId,
      description: "The id of the distribution",
      exportName: "distributionID",
    });
  }
}
