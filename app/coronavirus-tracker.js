const fs = require("fs");
const path = require("path");
const parse = require("csv-parse/lib/sync");

const FILENAME_CONFIRMED = "time_series_covid19_confirmed_global.csv";
const FILENAME_DEATHS = "time_series_covid19_deaths_global.csv";
const FILENAME_RECOVERED = "time_series_covid19_recovered_global.csv";

function extract(filepath, metric, data) {
  const csv = fs.readFileSync(filepath);
  const [headers, ...rows] = parse(csv);
  const [province, country, lat, long, ...dates] = headers;

  // HACK: CSVs have different date formats
  const normalDates = dates.map((date) => {
    let [month, day] = date.split("/");
    month = month.length === 2 ? month : `0${month}`;
    day = day.length === 2 ? day : `0${day}`;
    return `2020-${month}-${day}`;
  });

  rows.forEach(([province, country, lat, long, ...counts]) => {
    data["Global"] = data["Global"] || {};
    data["Global"]["ENGLISH"] = "Global";
    data["Global"][metric] = data["Global"][metric] || {};

    country = country === "US" ? "United States of America" : country;

    data[country] = data[country] || {};
    data[country]["ENGLISH"] = country;
    data[country][metric] = data[country][metric] || {};

    if (province) {
      data[country][province] = data[country][province] || {};
      data[country][province]["ENGLISH"] = province;
      data[country][province][metric] = data[country][province][metric] || {};
    }

    normalDates.forEach((date, i) => {
      data[country][metric][date] = data[country][metric][date] || 0;
      data[country][metric][date] += +counts[i];

      if (province) {
        data[country][province][metric][date] =
          data[country][province][metric][date] || 0;
        data[country][province][metric][date] += +counts[i];
      }

      data["Global"][metric][date] = data["Global"][metric][date] || 0;
      data["Global"][metric][date] += +counts[i];
    });
  });
  return [data, normalDates];
}

// HACK: Now all the names are the same, but leaving this just in case
const patchCountryNames = {};

function update(dataPath, outputPath) {
  const data = {
    confirmedCount: {},
    curedCount: {},
    deadCount: {},
  };

  const [confirmed, dates] = extract(
    path.resolve(dataPath, FILENAME_CONFIRMED),
    "confirmedCount",
    data
  );
  const [deaths] = extract(
    path.resolve(dataPath, FILENAME_DEATHS),
    "deadCount",
    confirmed
  );
  const [recovered] = extract(
    path.resolve(dataPath, FILENAME_RECOVERED),
    "curedCount",
    deaths
  );

  fs.writeFileSync(outputPath, JSON.stringify(data));
}

module.exports = update;
