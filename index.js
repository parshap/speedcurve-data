const fetch = require('node-fetch');
const flatMap = require('lodash/flatMap');

const API_URL = 'https://api.speedcurve.com/v1';
const config = require('./config.json');

const parallelLimit = async (limit, fns) => {
  const results = [];
  let i = 0;
  while (i < fns.length) {
    results.push(...(await Promise.all(
      fns.slice(i, i + limit)
        .map(fn => fn())
    )));
    i += limit;
  }
  return results;
}

const getAuth = (key) => (
 `Basic ${new Buffer(`${key}:x`).toString('base64')}`
);

const fetchApi = async (url, {
  key,
}) => {
  const res = await fetch(`${API_URL}${url}`, {
    headers: {
      'Authorization': getAuth(key),
    },
  });
  if (!res.ok) {
    const err = new Error(`Invalid response: ${res.status}`);
    err.res = res;
    throw err;
  }
  return res.json();
};

const getSites = urlsDataByTeam => flatMap(
  urlsDataByTeam,
  ({ teamId, data }) => (
    data.sites.map(site => ({
      teamId,
      siteId: site.site_id,
      name: site.name,
    }))
  )
);

const getSiteUrls = urlsDataByTeam => flatMap(
  urlsDataByTeam,
  ({ teamId, data }) => (
    flatMap(data.sites, site => (
      site.urls.map(url => ({
        teamId,
        urlId: url.url_id,
        siteId: site.site_id,
      }))
    ))
  )
);

const getSiteUrlFromUrlId = (urlId, siteUrls) => (
  siteUrls.find(siteUrl => siteUrl.urlId === urlId)
);

const getUrls = (urlDataArray, siteUrls) => urlDataArray.map(urlData => ({
  urlId: urlData.url_id,
  siteId: (getSiteUrlFromUrlId(urlData.url_id, siteUrls) || {}).siteId,
  teamId: (getSiteUrlFromUrlId(urlData.url_id, siteUrls) || {}).teamId,
  url: urlData.url,
  label: urlData.label,
}));

const getTests = (urlDataArray, siteUrls) => flatMap(urlDataArray, urlData =>
  urlData.tests.map(testData => ({
    ...testData,
    urlId: urlData.url_id,
    siteId: (getSiteUrlFromUrlId(urlData.url_id, siteUrls) || {}).siteId,
    teamId: (getSiteUrlFromUrlId(urlData.url_id, siteUrls) || {}).teamId,
  }))
);

/**
 * Variable naming convention:
 *
 * Raw data from API (SpeedCurve domain objects): named based on the endpoint
 * url and with a "data" suffix. For example, the response data from the /urls
 * endpoint is named "urlsData".
 *
 * Canonical objects (speedcurve-data domain objects): This module maps the
 * SpeedCurve API data to a set of speedcurve-data specific canonical domain
 * objects. These are named with no suffix.
 */

module.exports = async () => {
  const apiKeys = Object.values(config.teams);
  const urlsDataByTeam = await parallelLimit(5, apiKeys.map(
    (key, i) => async () => ({
      teamId: i,
      data: await fetchApi('/urls', { key }),
    })
  ));
  const sites = getSites(urlsDataByTeam);
  const siteUrls = getSiteUrls(urlsDataByTeam);
  const urlDataArray = await parallelLimit(5, siteUrls.map(
    ({ urlId, teamId }) => () => (
      fetchApi(`/urls/${urlId}?days=365`, {
        key: apiKeys[teamId],
      })
    )
  ));
  const urls = getUrls(urlDataArray, siteUrls);
  const tests = getTests(urlDataArray, siteUrls);
  return {
    sites,
    urls,
    tests
  };
};
