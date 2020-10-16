'use strict';
const AWS = require('aws-sdk');
const dynamoClient = new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});
const algoliasearch = require('algoliasearch');
const ssm = new AWS.SSM();
const secretsPromise = ssm.getParameters({
  Names: ['/algolia-sentimentalrobot/apikey-prod', '/algolia-sentimentalrobot/applicationid-prod'],
  WithDecryption: false
}).promise();

module.exports.transform = async event => {
  const record = event.Records[0];

  if (record.eventName != 'INSERT') {
    return;
  }
  console.log('Stream record: ', JSON.stringify(record, null, 2));

  const item = record.dynamodb.NewImage;
  const topHeadlines = item.topHeadlines.L;
  if (topHeadlines.length == 0) {
    throw new Error('topHeadlines is empty');
  }

  const formattedHeadlines = topHeadlines.map(e => e.S);
  const date = item.date.S;

  const sentimentScore = {
    Neutral: item.analysis.M.SentimentScore.M.Neutral.N,
    Negative: item.analysis.M.SentimentScore.M.Negative.N,
    Positive: item.analysis.M.SentimentScore.M.Positive.N,
    Mixed: item.analysis.M.SentimentScore.M.Mixed.N,
  }

  const formattedItem = {
    analysis_overall: item.analysis.M.Sentiment.S,
    analysis_details: sentimentScore,
    headlines: formattedHeadlines,
    date_formatted: date.slice(0, date.indexOf('T')),
    date_timestamp: Date.parse(date)
  }
  const secrets = await secretsPromise;
  let applicationId, apiKey;
  secrets.Parameters.forEach(e => {
    if (e.Name === '/algolia-sentimentalrobot/apikey-prod') {
      apiKey = e.Value;
    } else if (e.Name === '/algolia-sentimentalrobot/applicationid-prod') {
      applicationId = e.Value;
    }
  });
  const algoliaClient = algoliasearch(applicationId, apiKey);
  const index = algoliaClient.initIndex('prod_topheadlines');
  await index.saveObject(formattedItem, { autoGenerateObjectIDIfNotExist: true });
}

module.exports.bulkTransform = async event => {
  var params = {
    ExpressionAttributeNames: { "#year": "year" },
    ExpressionAttributeValues: {':year': 2020},
    KeyConditionExpression: '#year = :year',
    TableName: process.env.BBC_HEADLINES_TABLE,
  };

  const result = await dynamoClient.query(params).promise();
  const formattedItems = [];

  const items = result.Items.filter(e => e.topHeadlines[0]);
  for (let item of items) {
    const formattedItem = {
      analysis_overall: item.analysis.Sentiment,
      analysis_details: item.analysis.SentimentScore,
      headlines: item.topHeadlines,
      date_formatted: item.date.slice(0, item.date.indexOf('T')),
      date_timestamp: Date.parse(item.date)
    }
    formattedItems.push(formattedItem);
  }
  const secrets = await secretsPromise;
  let applicationId, apiKey;
  secrets.Parameters.forEach(e => {
    if (e.Name === '/algolia-sentimentalrobot/apikey-prod') {
      apiKey = e.Value;
    } else if (e.Name === '/algolia-sentimentalrobot/applicationid-prod') {
      applicationId = e.Value;
    }
  });
  const algoliaClient = algoliasearch(applicationId, apiKey);
  const index = algoliaClient.initIndex('prod_topheadlines');

  await index.saveObjects(formattedItems, { autoGenerateObjectIDIfNotExist: true });
}