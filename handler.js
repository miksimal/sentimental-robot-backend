'use strict';
const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const AWS = require('aws-sdk');
const client = new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});

module.exports.bbcScraper = async event => {
  const lambda  = new AWS.Lambda({region: 'eu-west-1'});
  const URL = 'https://bbc.co.uk';
  const response = await got(URL);
  const dom = new JSDOM(response.body);
  const MAX_LENGTH = 10;

  const headlineElements = dom.window.document.querySelectorAll("span.top-story__title");
  const headlineElementsArr = [...headlineElements];
  const length = headlineElements.length >= MAX_LENGTH ? MAX_LENGTH : headlineElements.length;
  
  let topHeadlines = headlineElementsArr.slice(0,length).map(e => e.textContent);
  let headlinesStrng = JSON.stringify(topHeadlines.join('. '));

  const analysisParams = {
    FunctionName: 'scrape-the-news-dev-analyser',
    InvocationType: "RequestResponse",
    Payload: headlinesStrng
  };

  const result = await lambda.invoke(analysisParams).promise();
  const resultObj = JSON.parse(result.Payload);
  const analysisResult = {Sentiment: resultObj.Sentiment, SentimentScore: resultObj.SentimentScore};

  let d = new Date();
  let isoDate = d.toISOString();

  const dbParams = {
    Item: {
      year: d.getFullYear(),
      date: isoDate,
      topHeadlines: topHeadlines,
      analysis: analysisResult
    },
    TableName: process.env.BBC_HEADLINES_TABLE
  };

  return client.put(dbParams).promise();
}