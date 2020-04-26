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

function getFormattedDate(d, add1day) {
  const date = d.length === 10 ? getDate(d) : getDateNinjaFormat(d);
  if (add1day) {
    date.setDate(date.getDate() + 1);
  }
  const formattedDate = `${date.getFullYear()}-${appendLeadingZeroes(
    date.getMonth() + 1
  )}-${appendLeadingZeroes(date.getDate())}`; //"2020-01-22"

  return formattedDate;
}

function getDateNinjaFormat(d) {
  const dateSplited = d.split("/"); //"4/24/20"
  const date = new Date(
    `20${dateSplited[2]}`,
    parseInt(dateSplited[0]) - 1,
    dateSplited[1]
  );
  return date;
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
  return country;
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

  data["Global"][metric][date] = data["Global"][metric][date] || 0;
  data["Global"][metric][date] = data["Global"][metric][date] + value;
}

function update(outputPath) {
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
          data["Global"] = data["Global"] || {};
          data["Global"]["ENGLISH"] = "Global";
          data["Global"]["confirmedCount"] =
            data["Global"]["confirmedCount"] || {};
          data["Global"]["deadCount"] = data["Global"]["deadCount"] || {};
          data["Global"]["curedCount"] = data["Global"]["curedCount"] || {};

          const lastHistoricalItem = {};
          let lastDate = null;
          historical.forEach((item) => {
            const country = getCountryMapped(item.country);

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
                item.timeline.recovered[i]
              );
            }
          });

          const nextDate = getFormattedDate(lastDate, true);

          current.forEach((item) => {
            const country = getCountryMapped(item.country);

            addItem(
              data,
              country,
              lastHistoricalItem,
              "confirmedCount",
              item.province,
              nextDate,
              item.cases
            );

            addItem(
              data,
              country,
              lastHistoricalItem,
              "deadCount",
              item.province,
              nextDate,
              item.deaths
            );

            addItem(
              data,
              country,
              lastHistoricalItem,
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
