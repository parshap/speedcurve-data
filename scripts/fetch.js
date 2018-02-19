#!/usr/bin/env node

const fs = require("fs");
const ndjson = require("ndjson");
const fetchData = require("../src/fetchData");
const parseArgs = require("../src/parseArgs");

const writeNdJson = (array, path) => {
  const stream = ndjson.serialize();
  stream.pipe(fs.createWriteStream(path));
  array.forEach(data => stream.write(data));
  stream.end();
};

const main = async () => {
  const options = parseArgs();
  const { sites, urls, tests } = await fetchData(options);
  writeNdJson(sites, `${options.data}/sites.ndjson`);
  writeNdJson(urls, `${options.data}/urls.ndjson`);
  writeNdJson(tests, `${options.data}/tests.ndjson`);
};

main();
