const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const coronavirusTracker = require("./coronavirus-tracker-v2");

const outputHashPath = path.join(__dirname, "../build", "data-hash.json");

const outputPathCoronavirusTracker = path.join(
  __dirname,
  "../build/coronavirus-tracker",
  "data.json"
);

coronavirusTracker(outputPathCoronavirusTracker);

fs.writeFileSync(outputHashPath, JSON.stringify({ hash: uuidv4() }));
