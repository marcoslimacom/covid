const path = require("path");
const update = require("./update-v2");

const dataPath = path.join(__dirname, "csv");
const outputPath = path.join(__dirname, "../docs", "full-data.json");
const outputHashPath = path.join(__dirname, "../docs", "full-data-hash.json");

update(dataPath, outputPath, outputHashPath);
