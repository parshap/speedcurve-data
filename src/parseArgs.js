const fs = require("fs");
const minimist = require("minimist");

module.exports = (argv = process.argv) => {
  const options = minimist(argv.slice(2), {
    default: {
      data: "data",
      configPath: "config.json",
    },
  });
  const config = JSON.parse(fs.readFileSync(options.configPath, "utf8"));
  return {
    ...options,
    ...config,
  };
};
