const through = require("through2");

const filters = [
  data => data.status !== 0,
  data => !data.speedindex,
  data => data.speedindex > 30000,
];

module.exports = () =>
  through.obj((data, enc, callback) => {
    if (filters.some(filter => filter(data))) {
      callback();
    } else {
      callback(null, data);
    }
  });
