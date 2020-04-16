Transforms the data from [CSSEGISandData/COVID-19](https://github.com/CSSEGISandData/COVID-19) into a json file. Available at [https://marcoslimacom.github.io/covid19/timeseries.json](https://marcoslimacom.github.io/covid19/timeseries.json). Updated three times a day using GitHub Actions.

The json contains the number of Coronavirus confirmed cases, deaths, and recovered cases for every country and every day since 2020-1-22:

```
{
  "Brazi": [
    {
      "date": "2020-1-22",
      "confirmed": 0,
      "deaths": 0,
      "recovered": 0
    },
    {
      "date": "2020-1-23",
      "confirmed": 1,
      "deaths": 0,
      "recovered": 0
    },
    ...
  ],
  ...
}
```

For example, if you want to use it from a web site:

```js
fetch("https://marcoslima.github.io/covid19/timeseries.json")
  .then(response => response.json())
  .then(data => {
    data["Brazil"].forEach(({ date, confirmed, recovered, deaths }) =>
      console.log(`${date} active cases: ${confirmed - recovered - deaths}`)
    );
  });
```

## License

The code from this repo is MIT licensed.  
The data is under [CSSEGISandData/COVID-19](https://github.com/CSSEGISandData/COVID-19/) terms of use.
