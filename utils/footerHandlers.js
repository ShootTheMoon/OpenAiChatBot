const fs = require("fs");

const openAiAd = "[Join OpenAI](http://t.me/OpenAIERC) | [Chart](https://www.dextools.io/app/en/ether/pair-explorer/0x670b681d8acca37d7e12c43f9d5114f4543e50ff) | [Buy](https://app.uniswap.org/#/swap?outputCurrency=0x6A6AA13393B7d1100c00a57c76c39e8B6C835041)";


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
