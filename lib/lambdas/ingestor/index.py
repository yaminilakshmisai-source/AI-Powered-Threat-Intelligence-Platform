import json
import boto3
import datetime
import uuid
import os

s3 = boto3.client('s3')
BUCKET = os.environ.get('BUCKET', 'threat-intel-logs-026651348916')

def handler(event, context):
    record = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "source": event.get("source", "unknown"),
        "type": event.get("detail-type", "unknown"),
        "region": event.get("region", "unknown"),
        "raw": event
    }

    key = f"raw/{record['timestamp'][:10]}/{record['id']}.json"

    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(record, indent=2),
        ContentType='application/json'
    )

    print(f"✅ Saved event: {record['id']} | type: {record['type']}")

    return {
        "statusCode": 200,
        "id": record['id'],
        "savedTo": key
    }