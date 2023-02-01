const fs = require("fs");

const openAiAd = "[Join EvolveAI](http://t.me/OpenAIERC) | [Chart](https://www.dextools.io/app/en/ether/pair-explorer/0xe2bf84f6e15097378144b7fdcff20da1fab71b14) | [Buy](https://app.uniswap.org/#/swap?outputCurrency=0x6fbc20483b53cea47839bb8e171abd6d67c3c696)";


const getFooterAd = () => {
  let data = fs.readFileSync("./data/footerAd.json", "utf-8");
  data = JSON.parse(data);
  if (data.enabled) {
    return "Ad: " + data.text;
  } else {
    return openAiAd;
  }
};

const toggleFooterAd = (toggle) => {
  let data = fs.readFileSync("./data/footerAd.json", "utf-8");
  data = JSON.parse(data);
  if (toggle === "on") {
    data.enabled = true;
    fs.writeFileSync("./data/footerAd.json", JSON.stringify(data));
    return "Ads enabled";
  } else if (toggle === "off") {
    data.enabled = false;
    fs.writeFileSync("./data/footerAd.json", JSON.stringify(data));
    return "Ads disabled";
  }
};

const setFooterAd = (text) => {
  let data = fs.readFileSync("./data/footerAd.json", "utf-8");
  data = JSON.parse(data);
  data.text = text;
  fs.writeFileSync("./data/footerAd.json", JSON.stringify(data));
};

module.exports = { setFooterAd, toggleFooterAd, getFooterAd };
