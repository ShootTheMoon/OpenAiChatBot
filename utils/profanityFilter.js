const fs = require("fs");

const profanityFilter = (msg) => {
  let data = fs.readFileSync("./data/profanityList.json", "utf-8");
  data = JSON.parse(data);
  for (let i = 0; i < data.length; i++) {
    if (msg.toLowerCase() == data[i]) {
      return true;
    }
  }
  return false;
};

const addToProfanityList = (text) => {
  let data = fs.readFileSync("./data/profanityList.json", "utf-8");
  data = JSON.parse(data);
  const found = data.findIndex((txt) => txt === txt);
  if (found != -1) {
    data.push(text);
    fs.writeFileSync("./data/profanityList.json", JSON.stringify(data));
  }
};

module.exports = { profanityFilter, addToProfanityList };
