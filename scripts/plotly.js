#!/usr/bin/env node

/**
 * Create a plotly data grid.
 *
 *     cat data/tests.ndjson | scripts/relevant.js | scripts/plotly.js \
 *       --plotlyUsername parshap \
 *       --plotlyKey 123123
 */

const ndjson = require("ndjson");
const pump = require("pump");
const through = require("through2");
const map = require("lodash/map");
const pick = require("lodash/pick");
const sortBy = require("lodash/sortBy");
const concat = require("concat-stream");
const fetch = require("node-fetch");
const parseArgs = require("../src/parseArgs");

const fields = [
  "speedindex",
  // "js_size",
  // "size",
  // "visually_complete",
  // "render",
  // "byte",
  // "requests",
  // "pagespeed",
];

const readData = stream =>
  new Promise((resolve, reject) =>
    pump(
      [
        stream,
        through.obj((data, enc, callback) => {
          callback(null, pick(data, ["timestamp", ...fields]));
        }),
        concat(data => {
          resolve(data);
        }),
      ],
      reject,
    ),
  );

const PLOTLY_API_URL = "https://api.plot.ly/v2";

const getAuth = (username, key) =>
  `Basic ${Buffer.from(`${username}:${key}`).toString("base64")}`;

const createGrid = async ({ username, key, cols }) => {
  const res = await fetch(`${PLOTLY_API_URL}/grids`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Plotly-Client-Platform": "speedcurve-data",
      Authorization: getAuth(username, key),
    },
    body: JSON.stringify({
      data: {
        cols,
      },
    }),
  });
  return res.json();
};

const main = async () => {
  const options = parseArgs();
  const stream = pump([process.stdin, ndjson.parse()]);
  const data = await readData(stream);
  const sorted = sortBy(data, "timestamp");
  const result = await createGrid({
    username: options.plotlyUsername,
    key: options.plotlyKey,
    cols: {
      timestamp: {
        data: map(sorted, "timestamp").map(t =>
          new Date(t * 1000).toISOString(),
        ),
        order: 0,
      },
      ...fields.reduce((acc, field, i) => {
        acc[field] = {
          data: map(sorted, field),
          order: i + 1,
        };
        return acc;
      }, {}),
    },
  });
  console.log(result);
};

main();
