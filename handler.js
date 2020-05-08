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

  const headlineElements = dom.window.document.querySelectorAll("h2 > strong");
  const headlineElementsArr = [...headlineElements];
  const length = headlineElements.length >= 10 ? 10 : headlineElements.length;

  let topHeadlines = headlineElementsArr.slice(0,length).map(e => e.textContent);

  var params = {
    Item: {
      date: Date.now(),
      topHeadlines: topHeadlines,
    },
    TableName: 'topHeadlines'
  };

  client.put(params, function(err){
    if(err){
      return { message: "failed to put into dynamodb with error " + err }
    } else {
      return { message: topHeadlines, event }
    }
  });
}