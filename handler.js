'use strict';
const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const AWS = require('aws-sdk');
const client = new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});

module.exports.bbcScraper = async event => {
  const comprehend = new AWS.Comprehend();
  const URL = 'https://bbc.co.uk/news';
  const response = await got(URL);
  const dom = new JSDOM(response.body);
  const MAX_LENGTH = 10;

  const headlineElements = dom.window.document.querySelectorAll("h3.gs-c-promo-heading__title");
  const headlineElementsArr = [...headlineElements];
  const adjustedArr = [];
  headlineElementsArr.map(e => {
    if (!adjustedArr.includes(e.textContent)) {
      adjustedArr.push(e.textContent);
    }
  });
  if (adjustedArr.length < 10) throw new Error('Found fewer than ' + MAX_LENGTH + ' headlines!');

  const topHeadlines = adjustedArr.slice(0,MAX_LENGTH);
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