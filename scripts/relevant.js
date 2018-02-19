#!/usr/bin/env node

const fs = require("fs");
const ndjson = require("ndjson");
const pump = require("pump");
const parseArgs = require("../src/parseArgs");
const readNdJsonToArray = require("../src/readNdJsonToArray");
const removeOutliers = require("../src/removeOutliers");
const removeThirdParty = require("../src/removeThirdParty");
const removeDuplicateUrls = require("../src/removeDuplicateUrls");

const main = async () => {
  const options = parseArgs();
  const urls = await readNdJsonToArray(
    fs.createReadStream(`${options.data}/urls.ndjson`),
  );
  pump([
    process.stdin,
    ndjson.parse(),
    removeOutliers(),
    removeThirdParty({
      domains: options.domains,
      urls,
    }),
    removeDuplicateUrls({
      urls,
    }),
    ndjson.serialize(),
    process.stdout,
  ]);
};

main();
