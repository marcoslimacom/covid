const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const update2 = require("./update-v2");
const coronavirusTracker = require("./coronavirus-tracker");

const outputHashPath = path.join(__dirname, "../docs", "data-hash.json");
const dataPath = path.join(__dirname, "csv");
const outputPath = path.join(__dirname, "../docs", "full-data.json");
const outputPathCoronavirusTracker = path.join(
  __dirname,
  "../docs/coronavirus-tracker",
  "data.json"
);

update2(dataPath, outputPath);
coronavirusTracker(dataPath, outputPathCoronavirusTracker);

fs.writeFileSync(outputHashPath, JSON.stringify({ hash: uuidv4() }));
