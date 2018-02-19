const ndjson = require("ndjson");
const concat = require("concat-stream");
const pump = require("pump");

module.exports = async stream =>
  new Promise((resolve, reject) =>
    pump([stream, ndjson.parse(), concat(resolve)], reject),
  );
