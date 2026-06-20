import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';

export class AiPoweredThreatIntelligencePlatformStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Reference your existing S3 bucket (already created via CLI)
    const logBucket = s3.Bucket.fromBucketName(
      this, 'ThreatLogBucket',
      `threat-intel-logs-${this.account}`
    );

    // Ingestor Lambda function
    const ingestor = new lambda.Function(this, 'IngestorLambda', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambdas/ingestor'),
      memorySize: 128,
      timeout: cdk.Duration.seconds(30),
      environment: {
        BUCKET: `threat-intel-logs-${this.account}`
      }
    });

    // Give Lambda permission to write to S3
    logBucket.grantWrite(ingestor);

    // EventBridge rule: CloudTrail events → ingestor Lambda
    new events.Rule(this, 'CloudTrailRule', {
      ruleName: 'cloudtrail-to-ingestor',
      description: 'Routes suspicious CloudTrail events to ingestor Lambda',
      eventPattern: {
        source: ['aws.cloudtrail'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventName: [
            'ConsoleLogin',
            'DeleteBucket',
            'TerminateInstances',
            'DeleteAccessKey',
            'PutBucketPolicy',
            'AuthorizeSecurityGroupIngress'
          ]
        }
      },
      targets: [new targets.LambdaFunction(ingestor)]
    });

    // Output the Lambda name for reference
    new cdk.CfnOutput(this, 'IngestorLambdaName', {
      value: ingestor.functionName,
      description: 'Ingestor Lambda function name'
    });
  }
}