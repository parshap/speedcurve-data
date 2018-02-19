#!/usr/bin/env node

/**
 * Filters out tests that are not "relevant":
 *
 * 1. Not a 1st-party domain (as specified by "domains" config)
 * 2. Has an "outlier" value (e.g., SpeedIndex > 30s)
 * 3. Is a duplicate url
 *
 * Should be piped a tests.ndjson file. Example:
 *
 *     cat data/tests.ndjson | scripts/relevant.js | wc -l
 */

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
