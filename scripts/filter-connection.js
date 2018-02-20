#!/usr/bin/env node

/**
 * Filters out tests that are not the given connection type.
 *
 * Valid connection types are:
 *
 * * 3g: latency=300, up=768, down=1600
 * * cable: latency=28, up=1000, down=5000
 *
 * Should be piped a tests.ndjson file. Example:
 *
 *     cat data/tests.ndjson | scripts/filter-connection.js 3g
 */

const ndjson = require("ndjson");
const pump = require("pump");
const through = require("through2");
const parseArgs = require("../src/parseArgs");

const isWithin = (val, equal, within) => Math.abs(val - equal) <= within;

const types = {
  "3g": ({ latency, up, down }) =>
    isWithin(latency, 300, 50) &&
    isWithin(up, 768, 100) &&
    isWithin(down, 1600, 200),
  cable: ({ latency, up, down }) =>
    isWithin(latency, 28, 10) &&
    isWithin(up, 1000, 120) &&
    isWithin(down, 5000, 400),
};

const main = async () => {
  const options = parseArgs();
  const type = options._[0];
  if (!types[type]) {
    throw new Error("Invalid connection type");
  }
  const typeTest = types[type];
  pump([
    process.stdin,
    ndjson.parse(),
    through.obj((data, enc, callback) => {
      if (
        typeTest({
          up: data.bandwidth_up,
          down: data.bandwidth_down,
          latency: data.bandwidth_latency,
        })
      ) {
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
