const uniqBy = require("lodash/uniqBy");
const map = require("lodash/map");
const through = require("through2");

module.exports = ({ urls }) => {
  const dedupedUrlIds = map(uniqBy(urls, "url"), "urlId");
  return through.obj((data, enc, callback) => {
    if (dedupedUrlIds.includes(data.urlId)) {
      callback(null, data);
    } else {
      callback();
    }
  });
};
