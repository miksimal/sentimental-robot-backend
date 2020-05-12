'use strict';
const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const AWS = require('aws-sdk');
const client = new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});
const URL = 'https://dr.dk';


module.exports.scraper = async event => {
  const response = await got(URL);
  const dom = new JSDOM(response.body);
  const MAX_LENGTH = 10;

  const headlineElements = dom.window.document.querySelectorAll("h2 > strong");
  const headlineElementsArr = [...headlineElements];
  const length = headlineElements.length >= MAX_LENGTH ? MAX_LENGTH : headlineElements.length;

  let topHeadlines = headlineElementsArr.slice(0,length).map(e => e.textContent);

  let d = new Date();
  let isoDate = d.toISOString();

  var params = {
    Item: {
      date: isoDate,
      topHeadlines: topHeadlines,
    },
    TableName: process.env.HEADLINES_TABLE
  };

  return client.put(params).promise();

}