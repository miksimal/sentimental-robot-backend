'use strict';
const AWS = require('aws-sdk');
const client = new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});


module.exports.getLatest = async event => {

  let d = new Date();
  let y1 = d.getFullYear();
  d.setDate(d.getDate() - 7);
  let isoDate = d.toISOString();
  let y2 = d.getFullYear();

  var params1 = {
    ExpressionAttributeNames: { "#date": "date", "#year": "year" },
    ExpressionAttributeValues: {
      ':d': isoDate,
      ':y1': y1
     },
   KeyConditionExpression: '#year = :y1 AND #date > :d',
   TableName: process.env.HEADLINES_TABLE
  };

  if (y1 != y2) {
    var params2 = {
      ExpressionAttributeNames: { "#date": "date", "#year": "year" },
      ExpressionAttributeValues: {
        ':d': isoDate,
        ':y2': y2
        },
      KeyConditionExpression: '#year = :y2 AND #date > :d',
      TableName: process.env.HEADLINES_TABLE
    };
  }

  try {
    let result;

    if(y1 != y2) {
        let resultPromise1 = client.query(params1).promise();
        let resultPromise2 = client.query(params2).promise();
        const [result1, result2] = await Promise.all([resultPromise1,resultPromise2]);
        result = [...result1.Items, ...result2.Items];
    } else { 
      result = await client.query(params1).promise();
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(
        {
          data: result.Items
        }
      )
    };
  }
  catch(err) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(
        {
          message: "Sorry! Something went wrong: " + err
        }
      )
    };
  }
}

module.exports.getLatestBbc = async event => {

  let d = new Date();
  let y1 = d.getFullYear();
  d.setDate(d.getDate() - 7);
  let isoDate = d.toISOString();
  let y2 = d.getFullYear();

  var params1 = {
    ExpressionAttributeNames: { "#date": "date", "#year": "year" },
    ExpressionAttributeValues: {
      ':d': isoDate,
      ':y1': y1
     },
   KeyConditionExpression: '#year = :y1 AND #date > :d',
   TableName: process.env.BBC_HEADLINES_TABLE
  };

  if (y1 != y2) {
    var params2 = {
      ExpressionAttributeNames: { "#date": "date", "#year": "year" },
      ExpressionAttributeValues: {
        ':d': isoDate,
        ':y2': y2
        },
      KeyConditionExpression: '#year = :y2 AND #date > :d',
      TableName: process.env.BBC_HEADLINES_TABLE
    };
  }

  try {
    let result;

    if(y1 != y2) {
        let resultPromise1 = client.query(params1).promise();
        let resultPromise2 = client.query(params2).promise();
        const [result1, result2] = await Promise.all([resultPromise1,resultPromise2]);
        result = [...result1.Items, ...result2.Items];
    } else { 
      result = await client.query(params1).promise();
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(
        {
          data: result.Items
        }
      )
    };
  }
  catch(err) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials": true // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(
        {
          message: "Sorry! Something went wrong: " + err
        }
      )
    };
  }
}