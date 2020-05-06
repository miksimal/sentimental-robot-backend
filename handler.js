'use strict';
const got = require('got');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const URL = 'https://dr.dk';


module.exports.scraper = async event => {
  const response = await got(URL);
  const dom = new JSDOM(response.body);

  const headlineElements = dom.window.document.querySelectorAll("h2 > strong");
  const headlineElementsArr = [...headlineElements];
  const length = headlineElements.length >= 10 ? 10 : headlineElements.length;

  let topHeadlines = headlineElementsArr.slice(0,length).map(e => e.textContent);

  return { message: topHeadlines, event }

}