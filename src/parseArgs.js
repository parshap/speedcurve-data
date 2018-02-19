const minimist = require("minimist");

module.exports = (argv = process.argv) =>
  minimist(argv.slice(2), {
    default: {
      data: process.cwd(),
    },
  });
