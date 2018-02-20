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
const map = require("lodash/map");
const range = require("lodash/range");
const pick = require("lodash/pick");
const sortBy = require("lodash/sortBy");
const concat = require("concat-stream");
const CliGraph = require("cli-graph");
const d3Scale = require("d3-scale");
const d3Array = require("d3-array");
const parseArgs = require("../src/parseArgs");

const getChartSize = ({ width, height }) => ({
  width: width || Math.min(Math.max(process.stdout.columns - 4, 20), 120) || 40,
  height: height || Math.min(Math.max(process.stdout.rows - 4, 15), 90) || 30,
});

const readData = (stream, field) =>
  new Promise((resolve, reject) =>
    pump(
      [
        stream,
        through.obj((data, enc, callback) => {
          callback(null, pick(data, ["timestamp", field]));
        }),
        concat(data => {
          resolve(data);
        }),
      ],
      reject,
    ),
  );

const formatDateTick = timestamp => {
  const d = new Date(timestamp * 1000);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

const copyStringToArray = (arr, str, pos) => {
  for (let i = 0; i < str.length; i += 1) {
    // eslint-disable-next-line no-param-reassign
    arr[pos + i] = str[i];
  }
};

const renderLine = ({ length = 80, lines = [] }) => {
  // Ridiculous way to make an array of length with initialized to ' '
  const arr = new Array(length + 1).join(" ").split("");
  lines.forEach(({ align, position, value }) => {
    let copyPos = position;
    if (align === "right") {
      copyPos -= value.length;
    } else if (align === "center") {
      copyPos -= Math.floor(value.length / 2);
    }
    if (copyPos < 0) {
      copyPos += length;
    }
    copyStringToArray(arr, value, copyPos);
  });
  return arr.join("").trimRight();
};

const periods = {
  daily: 60 * 60 * 24,
  weekly: 60 * 60 * 24 * 7,
};

const movingAverage = (xValues, yValues, isNear) => x => {
  let sum = 0;
  let count = 0;
  xValues.forEach((someX, i) => {
    if (isNear(x, someX)) {
      sum += yValues[i];
      count += 1;
    }
  });
  return sum / count;
};

const renderChart = ({
  width = 40,
  height = 30,
  xValues = [],
  yValues = [],
  period = 0,
  char,
}) => {
  const getMovingAvg = movingAverage(
    xValues,
    yValues,
    (x1, x2) => x1 - x2 >= 0 && x1 - x2 <= period,
  );
  const chartWidth = Math.floor(width / 2);
  const chart = new CliGraph({
    width: chartWidth,
    height,
    center: {
      x: 0,
      y: height - 1,
    },
  });

  const xScale = d3Scale.scaleLinear().domain(d3Array.extent(xValues));
  const x = xScale.range([0, chartWidth]);
  const averagedYValues = range(1, chartWidth).map(i =>
    getMovingAvg(x.invert(i)),
  );
  const yScale = d3Scale
    .scaleLinear()
    .domain(d3Array.extent(averagedYValues))
    .nice(2);
  const y = yScale.range([0, height]);
  chart.setFunctionX(xVal => y(getMovingAvg(x.invert(xVal))), 1, chartWidth, char);
  return [
    yScale.domain()[1],
    "\n",
    chart.toString(),
    yScale.domain()[0],
    "\n",
    renderLine({
      length: width,
      lines: [
        {
          position: 0,
          value: formatDateTick(xScale.domain()[0]),
        },
        {
          position: -1,
          align: "right",
          value: formatDateTick(xScale.domain()[1]),
        },
      ],
    }),
  ].join("");
};

const main = async () => {
  const options = parseArgs();
  const { field = "speedindex", period = "daily" } = options;
  if (!periods[period]) {
    throw new Error("Invalid period");
  }
  const periodValue = periods[period];
  const { width, height } = getChartSize({
    width: options.width,
    height: options.height,
  });

  const stream = pump([process.stdin, ndjson.parse()]);
  const data = await readData(stream, field);

  const sorted = sortBy(data, "timestamp");
  const xValues = map(sorted, "timestamp");
  const yValues = map(sorted, field);
  console.log(
    renderChart({
      width,
      height,
      xValues,
      yValues,
      period: periodValue,
      char: options.char,
    }),
  );
};

main();
