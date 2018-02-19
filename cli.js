#!/usr/bin/env node

const process = require("process");
const fs = require("fs");
const ndjson = require("ndjson");
const minimist = require("minimist");
const fetchData = require("./index");

const writeNdJson = (array, path) => {
  const stream = ndjson.serialize();
  stream.pipe(fs.createWriteStream(path));
  array.forEach(data => stream.write(data));
  stream.end();
};

const main = async () => {
  const { sites, urls, tests } = await fetchData();
  const options = minimist(process.argv.slice(2), {
    default: {
      data: process.cwd(),
    },
  });
  writeNdJson(sites, `${options.data}/sites.ndjson`);
  writeNdJson(urls, `${options.data}/urls.ndjson`);
  writeNdJson(tests, `${options.data}/tests.ndjson`);
};

main();
