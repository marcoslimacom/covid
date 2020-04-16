const fs = require("fs");
const path = require("path");
const csvtojson = require("csvtojson");
const { v4: uuidv4 } = require("uuid");

const FILENAME_COVID_DATA = "owid-covid-data.csv";

async function update(dataPath, outputPath, outputHashPath) {
  var filePath = path.resolve(dataPath, FILENAME_COVID_DATA);
  let data = await csvtojson().fromFile(filePath);

  data = data.map((item) => {
    return {
      i: item.iso_code,
      l: item.location,
      d: item.date,
      tc: item.total_cases,
      nw: item.new_cases,
      td: item.total_deaths,
      nd: item.new_deaths,
      tcm: item.total_cases_per_million,
      nm: item.new_cases_per_million,
      tdm: item.total_deaths_per_million,
      ndm: item.new_deaths_per_million,
      tt: item.total_tests,
      nt: item.new_tests,
      ttt: item.total_tests_per_thousand,
      ntt: item.new_tests_per_thousand,
      tu: item.tests_units,
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify(data));
  fs.writeFileSync(outputHashPath, JSON.stringify({ hash: uuidv4() }));
}

module.exports = update;
