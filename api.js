'use strict';
const AWS = require('aws-sdk');
const client = new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});


module.exports.getLatest = async event => {

  let d = new Date();
  d.setDate(d.getDate - 7);
  let isoDate = d.toISOString();

  var params = {
    ExpressionAttributeValues: {
      ':date': isoDate
     },
   KeyConditionExpression: 'date > :date',
   TableName: process.env.HEADLINES_TABLE
  };

  try {
    const result = await client.query(params).promise();
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(
        {
          message: "Success! Here are your headlines",
          data: result.data.Items
        }
      )
    };
  }
  catch(err) {
    console.log("Error", err);
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(
        {
          message: "Sorry! Something went wrong..."
        }
      )
    };
  }
}