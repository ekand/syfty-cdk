import json
import boto3


headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST"
}


def lambda_handler(event, context):
    print(json.dumps(event))
    email = event["body"]
    if event["httpMethod"] == "OPTIONS":
        return {"statusCode": 200, "headers": headers}
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('syfty-emails-table')
    response2 = table.update_item(
        Key={
            'email': email,
        },
        UpdateExpression='SET arbitrarynumber = :val1',
        ExpressionAttributeValues={
            ':val1': 1
        }
    )
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
        },
        'body': json.dumps({"email_saved": "yes"})
    }
