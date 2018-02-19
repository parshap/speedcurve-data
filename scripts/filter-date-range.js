#!/usr/bin/env node

/**
 * Filters out tests that are not within the given date range.
 *
 * Should be piped a tests.ndjson file. Example:
 *
 *     cat data/tests.ndjson | scripts/filter-date-range.js \
 *       --from "6 months ago"
 */

const ndjson = require("ndjson");
const pump = require("pump");
const through = require("through2");
const chrono = require("chrono-node");
const parseArgs = require("../src/parseArgs");

const main = async () => {
  const options = parseArgs();
  const from = options.from && chrono.parseDate(options.from);
  const to = options.to && chrono.parseDate(options.to);
  pump([
    process.stdin,
    ndjson.parse(),
    through.obj((data, enc, callback) => {
      const date = new Date(data.timestamp * 1000);
      if (from && date < from) {
        callback();
        return;
      }
      if (to && date > to) {
        callback();
        return;
      }
      callback(null, data);
    }),
    ndjson.serialize(),
    process.stdout,
  ]);
};

main();
