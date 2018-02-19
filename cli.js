#!/usr/bin/env node

const fetchData = require("./index");

const main = async () => {
  const { sites, urls, tests } = await fetchData();
  console.log(
    JSON.stringify(
      {
        sites,
        urls,
        tests,
      },
      null,
      2,
    ),
  );
};

main();
