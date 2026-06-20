# AI-Powered Threat Intelligence Platform on AWS

I'm building a system that watches my cloud account like a security
guard — it automatically detects suspicious activity using AI and
blocks the threat before any damage is done, without anyone needing
to do anything manually.

## Status

✅ Ingestion pipeline live and verified end-to-end
🚧 Next up: enricher Lambda + ML anomaly detection model

## What it does

- Captures every security-relevant action in the AWS account via
  CloudTrail and VPC Flow Logs
- Streams those events through CloudWatch Logs into a Lambda function
  in real time
- Saves structured event records to S3 for downstream processing
- (Coming next) Scores each event for anomaly likelihood using a
  self-trained Isolation Forest model
- (Coming next) Automatically blocks high-severity threats — IP
  blocks, IAM key revocation, instance isolation
- (Coming next) Live dashboard showing detected threats and actions
  taken

## Architecture

CloudTrail + VPC Flow Logs
|
v
CloudWatch Logs
|
v
Subscription Filter
|
v
Ingestor Lambda
|
v
S3 (raw events)

## Architecture decision: CloudWatch Logs instead of EventBridge

Originally planned CloudTrail -> EventBridge -> Lambda using
EventBridge's native `aws.cloudtrail` event source. After verifying
every other piece was correctly configured — event pattern matching,
IAM permissions, trail settings, Lambda resource policy — found that
EventBridge was not reliably delivering CloudTrail management events
in this setup.

Switched to CloudTrail -> CloudWatch Logs -> Subscription Filter ->
Lambda instead. This delivers events deterministically within
seconds and is a known production pattern used specifically to work
around EventBridge's CloudTrail delivery limitations.

## Tech stack

- AWS CDK (TypeScript) — infrastructure as code
- Python 3.12 — Lambda functions
- AWS services — Lambda, CloudTrail, CloudWatch Logs, S3, VPC Flow
  Logs, IAM (more coming: Step Functions, SNS, DynamoDB)

## AWS services used

| Service | Purpose |
|---|---|
| CloudTrail | Records every API call made in the account |
| VPC Flow Logs | Records network traffic in the VPC |
| CloudWatch Logs | Receives CloudTrail events, triggers Lambda via subscription filter |
| Lambda | Processes and stores security events |
| S3 | Stores raw event records |
| IAM | Least-privilege roles and permissions for every component |
| CDK + CloudFormation | Full infrastructure as code |

## How to deploy

```bash
git clone https://github.com/yaminilakshmisai-source/AI-Powered-Threat-Intelligence-Platform.git
cd AI-Powered-Threat-Intelligence-Platform
npm install
cdk deploy
```

## Cost

₹0 — built entirely on AWS free tier. GuardDuty was excluded since
it required a paid plan on this account; replaced with a
self-trained ML model instead (in progress).