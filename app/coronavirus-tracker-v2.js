const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

//https://corona.lmao.ninja/v2/historical?lastdays=1000
// [
//   {
//     "country": "Afghanistan",
//     "province": null,
//     "timeline": {
//       "cases": {
//         "4/24/20": 1351
//       },
//       "deaths": {
//         "4/24/20": 43
//       },
//       "recovered": {
//         "4/24/20": 188
//       }
//     }
//   }
// ]

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

function appendLeadingZeroes(n) {
  if (n <= 9) {
    return "0" + n;
  }
  return n;
}

function getFormattedDate(d) {
  const date = getDate(d);
  const formattedDate = `${date.getFullYear()}-${appendLeadingZeroes(
    date.getMonth() + 1
  )}-${appendLeadingZeroes(date.getDate())}`; //"2020-01-22"

  return formattedDate;
}

function getDate(d) {
  const dateSplited = d.split("/"); //"4/24/20"
  let date = new Date(
    `20${dateSplited[2]}`,
    parseInt(dateSplited[0]) - 1,
    dateSplited[1]
  );
  return date;
}

function addItem(
  data,
  country,
  lastHistoricalItem,
  metric,
  province,
  date,
  value
) {
  data[country] = data[country] || {};
  data[country]["ENGLISH"] = country;
  data[country][metric] = data[country][metric] || {};
  lastHistoricalItem[country] = lastHistoricalItem[country] || {};
  lastHistoricalItem[country][metric] =
    lastHistoricalItem[country][metric] || {};

  data[country][metric][date] = data[country][metric][date]
    ? data[country][metric][date]
    : 0;

  data[country][metric][date] = data[country][metric][date]
    ? data[country][metric][date]
    : 0;

  data[country][metric][date] = data[country][metric][date] + value;

  lastHistoricalItem[country][metric] = data[country][metric][date];

  // if (province) {
  //   data[country][province][metric][date] = value;

  //   lastHistoricalItem[country][province] = lastHistoricalItem[
  //     country
  //   ][province]
  //     ? lastHistoricalItem[country][province]
  //     : {};

  //   lastHistoricalItem[country][province][metric] = value;
  // }
}

function update(dataPath, outputPath) {
  const data = {
    confirmedCount: {},
    curedCount: {},
    deadCount: {},
  };

  fetch("https://corona.lmao.ninja/v2/historical?lastdays=1000")
    .then((res) => res.json())
    .then((historical) => {
      fetch("https://corona.lmao.ninja/v2/countries")
        .then((res) => res.json())
        .then((current) => {
          const lastHistoricalItem = {};
          let lastDate = null;
          historical.forEach((item) => {
            const country =
              item.country === "USA"
                ? "United States of America"
                : item.country;

            // if (item.province) {
            //   data[country][item.province] = data[country][item.province] || {};
            //   data[country][item.province]["ENGLISH"] = item.province;
            //   data[country][item.province]["deadCount"] =
            //     data[country][item.province]["deadCount"] || {};
            //   data[country][item.province]["curedCount"] =
            //     data[country][item.province]["curedCount"] || {};
            //   data[country][item.province]["confirmedCount"] =
            //     data[country][item.province]["confirmedCount"] || {};
            // }

            for (var i in item.timeline.cases) {
              var date = getFormattedDate(i);
              lastDate = date;

              addItem(
                data,
                country,
                lastHistoricalItem,
                "confirmedCount",
                item.province,
                date,
                item.timeline.cases[i]
              );
            }

            for (var i in item.timeline.deaths) {
              var date = getFormattedDate(i);
              lastDate = date;

              addItem(
                data,
                country,
                lastHistoricalItem,
                "deadCount",
                item.province,
                date,
                item.timeline.deaths[i]
              );
            }

            for (var i in item.timeline.recovered) {
              var date = getFormattedDate(i);
              lastDate = date;

              addItem(
                data,
                country,
                lastHistoricalItem,
                "curedCount",
                item.province,
                date,
                item.timeline.deaths[i]
              );
            }
          });

          current.forEach((item) => {
            const country =
              item.country === "USA"
                ? "United States of America"
                : item.country;
            const date = getFormattedDate(lastDate);

            addItem(
              data,
              country,
              lastHistoricalItem,
              "confirmedCount",
              item.province,
              date,
              item.cases
            );

            addItem(
              data,
              country,
              lastHistoricalItem,
              "deadCount",
              item.province,
              date,
              item.deaths
            );

            addItem(
              data,
              country,
              lastHistoricalItem,
              "curedCount",
              item.province,
              date,
              item.recovered
            );
          });

          fetch("https://corona.lmao.ninja/v2/all")
            .then((res) => res.json())
            .then((global) => {
              data["Global"] = {};
              data["Global"]["ENGLISH"] = "Global";
              data["Global"]["confirmedCount"] = global.cases;
              data["Global"]["deadCount"] = global.deaths;
              data["Global"]["curedCount"] = global.recovered;

              fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
            })
            .catch((err) => console.error(err));
        })
        .catch((err) => console.error(err));
    })
    .catch((err) => console.log(err));
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
