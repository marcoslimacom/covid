const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const parse = require("csv-parse/lib/sync");

//https://corona.lmao.ninja/v2/countries
// [
//   {
//     updated: 1587864583035,
//     country: "Afghanistan",
//     countryInfo: {
//       _id: 4,
//       iso2: "AF",
//       iso3: "AFG",
//       lat: 33,
//       long: 65,
//       flag: "https://corona.lmao.ninja/assets/img/flags/af.png",
//     },
//     cases: 1463,
//     todayCases: 0,
//     deaths: 47,
//     todayDeaths: 0,
//     recovered: 188,
//     active: 1228,
//     critical: 7,
//     casesPerOneMillion: 38,
//     deathsPerOneMillion: 1,
//     tests: 7425,
//     testsPerOneMillion: 191,
//     continent: "Asia",
//   },
// ];

//https://corona.lmao.ninja/v2/all
// {
//   "updated": 1587874075195,
//   "cases": 2921439,
//   "todayCases": 2035,
//   "deaths": 203289,
//   "todayDeaths": 125,
//   "recovered": 836978,
//   "active": 1881172,
//   "critical": 57865,
//   "casesPerOneMillion": 375,
//   "deathsPerOneMillion": 26,
//   "tests": 26923971,
//   "testsPerOneMillion": 3456,
//   "affectedCountries": 212
// }

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

    lastDate = null;
    normalDates.forEach((date, i) => {
      lastDate = date;
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
  return [data, normalDates, lastDate];
}

function updateV1(data, dataPath) {
  const [confirmed, dates, lastDate] = extract(
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

  return lastDate;
}

function appendLeadingZeroes(n) {
  if (n <= 9) {
    return "0" + n;
  }
  return n;
}

function getNextDate(d) {
  const date = getDate(d);
  const today = new Date();

  if (
    date.getFullYear() !== today.getUTCFullYear() ||
    date.getMonth() !== today.getUTCMonth() ||
    date.getDate() !== today.getUTCDate()
  ) {
    return `${today.getUTCFullYear()}-${appendLeadingZeroes(
      today.getUTCMonth() + 1
    )}-${appendLeadingZeroes(today.getUTCDate())}`;
  }

  const formattedDate = `${date.getUTCFullYear()}-${appendLeadingZeroes(
    date.getUTCMonth() + 1
  )}-${appendLeadingZeroes(date.getUTCDate())}`;
  return formattedDate;
}

function getDate(d) {
  const dateSplited = d.split("-"); //"2020-04-24"
  const date = new Date(
    dateSplited[0],
    parseInt(dateSplited[1]) - 1,
    dateSplited[2]
  );
  return date;
}

function getCountryMapped(country) {
  country = country === "USA" ? "United States of America" : country;
  country = country === "Libyan Arab Jamahiriya" ? "Libya" : country;
  country = country === "UK" ? "United Kingdom" : country;
  country = country === "S. Korea" ? "South Korea" : country;
  return country;
}

function addItem(data, country, metric, province, date, value) {
  data[country] = data[country] || {};
  data[country]["ENGLISH"] = country;
  data[country][metric] = data[country][metric] || {};

  data[country][metric][date] = value;

  // if (province) {
  //   data[country][province][metric][date] = value;
  // }
}

function update(dataPath, outputPath) {
  const data = {
    confirmedCount: {},
    curedCount: {},
    deadCount: {},
  };

  fetch("https://corona.lmao.ninja/v2/countries")
    .then((res) => res.json())
    .then((current) => {
      data["Global"] = data["Global"] || {};
      data["Global"]["ENGLISH"] = "Global";
      data["Global"]["confirmedCount"] = data["Global"]["confirmedCount"] || {};
      data["Global"]["deadCount"] = data["Global"]["deadCount"] || {};
      data["Global"]["curedCount"] = data["Global"]["curedCount"] || {};

      let lastDate = updateV1(data, dataPath);

      const nextDate = getNextDate(lastDate);

      current.forEach((item) => {
        const country = getCountryMapped(item.country);

        addItem(
          data,
          country,
          "confirmedCount",
          item.province,
          nextDate,
          item.cases
        );

        addItem(
          data,
          country,
          "deadCount",
          item.province,
          nextDate,
          item.deaths
        );

        addItem(
          data,
          country,
          "curedCount",
          item.province,
          nextDate,
          item.recovered
        );
      });

      fetch("https://corona.lmao.ninja/v2/all")
        .then((res) => res.json())
        .then((global) => {
          data["Global"]["confirmedCount"][nextDate] = global.cases;
          data["Global"]["deadCount"][nextDate] = global.deaths;
          data["Global"]["curedCount"][nextDate] = global.recovered;

          fs.writeFileSync(outputPath, JSON.stringify(data));
        })
        .catch((err) => console.error(err));
    })
    .catch((err) => console.error(err));
}

module.exports = update;

// {
//   "confirmedCount": {},
//   "curedCount": {},
//   "deadCount": {},
//   "Global": {
//     "ENGLISH": "Global",
//     "confirmedCount": {
//       "2020-01-22": 555
//     },
//     "deadCount": {
//       "2020-01-22": 17
//     },
//     "curedCount": {
//       "2020-01-22": 28
//     }
//   }
// }
