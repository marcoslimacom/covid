const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const coronavirusTracker = require("./coronavirus-tracker-v2");

const dataPath = path.join(__dirname, "csv");
const outputHashPath = path.join(__dirname, "../build", "data-hash.json");

const outputPathCoronavirusTracker = path.join(
  __dirname,
  "../build/coronavirus-tracker",
  "data.json"
);

coronavirusTracker(dataPath, outputPathCoronavirusTracker);

fs.writeFileSync(outputHashPath, JSON.stringify({ hash: uuidv4() }));
