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

    data[country] = data[country] || {};
    data[country]["ENGLISH"] = country;
    data[country][metric] = data[country][metric] || {};

    normalDates.forEach((date, i) => {
      data[country][metric][date] = data[country][date] || 0;
      data[country][metric][date] += +counts[i];

      data["Global"][metric][date] = data["Global"][metric][date] || 0;
      data["Global"][metric][date] =
        data["Global"][metric][date] + data[country][metric][date];
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
  const countries = Object.keys(confirmed);
  const results = {};

  countries.forEach((country) => {
    // Some country names are different in the recovered dataset
    const recoverdCountry = patchCountryNames[country] || country;

    if (!recovered[recoverdCountry]) {
      console.warn(`${recoverdCountry} is missing from the recovered dataset`);
    }

    results[country] = dates.map((date) => {
      return {
        date,
        confirmed: confirmed[country][date],
        deaths: deaths[country][date],
        recovered:
          recovered[recoverdCountry] && recovered[recoverdCountry][date] != null
            ? recovered[recoverdCountry][date]
            : null,
      };
    });
  });

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

module.exports = update;
