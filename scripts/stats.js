#!/usr/bin/env node

/**
 * Prints stats (mean, stdev, etc.) about various values (e.g,. SpeedIndex).
 * Should be piped a tests.ndjson file. Example:
 *
 *     cat data/tests.ndjson | scripts/relevant.js | scripts/stats.js
 */

const ndjson = require("ndjson");
const pump = require("pump");
const through = require("through2");
const pick = require("lodash/pick");
const map = require("lodash/map");
const min = require("lodash/min");
const max = require("lodash/max");
const concat = require("concat-stream");
const statsLite = require("stats-lite");

const readTestsStats = stream => {
  const fields = [
    "speedindex",
    "js_size",
    "size",
    "visually_complete",
    "render",
    "byte",
    "requests",
    "pagespeed",
  ];
  return new Promise((resolve, reject) =>
    pump(
      [
        stream,
        through.obj((data, enc, callback) => {
          callback(null, pick(data, fields));
        }),
        concat(data => {
          const stats = fields.reduce((acc, fieldName) => {
            const values = map(data, fieldName);
            acc[fieldName] = {
              min: min(values),
              max: max(values),
              mean: statsLite.mean(values),
              median: statsLite.median(values),
              mode: statsLite.mode(values),
              variance: statsLite.variance(values),
              stdev: statsLite.stdev(values),
            };
            return acc;
          }, {});
          resolve(stats);
        }),
      ],
      reject,
    ),
  );
};

const main = async () => {
  const stream = pump([process.stdin, ndjson.parse()]);
  const stats = await readTestsStats(stream);
  console.log(stats);
};

main();
