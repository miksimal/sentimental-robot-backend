'use strict';
const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const AWS = require('aws-sdk');
const client = new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});

module.exports.bbcScraper = async event => {
  const comprehend = new AWS.Comprehend();
  const URL = 'https://bbc.co.uk';
  const response = await got(URL);
  const dom = new JSDOM(response.body);
  const MAX_LENGTH = 10;

  const headlineElements = dom.window.document.querySelectorAll("span.top-story__title");
  const headlineElementsArr = [...headlineElements];
  const length = headlineElements.length >= MAX_LENGTH ? MAX_LENGTH : headlineElements.length;
  
  const topHeadlines = headlineElementsArr.slice(0,length).map(e => e.textContent);
  const headlinesString = JSON.stringify(topHeadlines.join('. '));

  const comprehendResult = await comprehend.detectSentiment({Text: headlinesString, LanguageCode: "en"}).promise();
  const analysisResult = {Sentiment: comprehendResult.Sentiment, SentimentScore: comprehendResult.SentimentScore};

  const d = new Date();
  const isoDate = d.toISOString();

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