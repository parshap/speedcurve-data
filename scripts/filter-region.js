#!/usr/bin/env node

/**
 * Filters out tests that are not the given region.
 *
 * Valid regions are: east, west.
 *
 * Should be piped a tests.ndjson file. Example:
 *
 *     cat data/tests.ndjson | scripts/filter-region.js east
 */

const ndjson = require("ndjson");
const pump = require("pump");
const through = require("through2");
const parseArgs = require("../src/parseArgs");

const regions = {
  east: ({ region }) => region === "us-east-1",
  west: ({ region }) => region === "us-west-1",
};

const main = async () => {
  const options = parseArgs();
  const region = options._[0];
  if (!regions[region]) {
    throw new Error("Invalid region");
  }
  const regionTest = regions[region];
  pump([
    process.stdin,
    ndjson.parse(),
    through.obj((data, enc, callback) => {
      if (regionTest(data)) {
        callback(null, data);
        return;
      }
      callback();
    }),
    ndjson.serialize(),
    process.stdout,
  ]);
};

main();
