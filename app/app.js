const path = require("path");
const update = require("./update");

const dataPath = path.join(__dirname, "csv");
const outputPath = path.join(__dirname, "../data", "timeseries.json");

update(dataPath, outputPath);
