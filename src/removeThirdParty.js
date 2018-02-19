const map = require("lodash/map");
const through = require("through2");

const isFirstParty = (url, domains) =>
  domains.some(domain => url.indexOf(`${domain}/`) === 0);

module.exports = ({ domains, urls }) => {
  const firstPartyUrls = urls.filter(urlData =>
    isFirstParty(urlData.url, domains),
  );
  const firstPartyUrlIds = map(firstPartyUrls, "urlId");
  return through.obj((data, enc, callback) => {
    if (firstPartyUrlIds.includes(data.urlId)) {
      callback(null, data);
    } else {
      callback();
    }
  });
};
