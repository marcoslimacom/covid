const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const update2 = require("./update-v2");
const update3 = require("./update-v3");

const outputHashPath = path.join(__dirname, "../docs", "data-hash.json");
const dataPath = path.join(__dirname, "csv");
const outputPath = path.join(__dirname, "../docs", "full-data.json");
const outputPathV3 = path.join(__dirname, "../docs", "full-data-v3.json");

update2(dataPath, outputPath);
update3(dataPath, outputPathV3);

fs.writeFileSync(outputHashPath, JSON.stringify({ hash: uuidv4() }));