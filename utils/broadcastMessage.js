const fs = require("fs");

const footerAdd = `[Join OpenAI](http://t.me/OpenAIERC) | [Chart](https://www.dextools.io/app/ether/pair-explorer/0x670b681d8acca37d7e12c43f9d5114f4543e50ff) | [Buy](https://app.uniswap.org/#/swap?outputCurrency=0x6A6AA13393B7d1100c00a57c76c39e8B6C835041)`;

const broadcast = (ctx, msg = false) => {
  try {
    if (msg) {
      let data = fs.readFileSync("./data/groupData.json");
      data = JSON.parse(data);
      const groups = data.groups;
      for (let i = 0; i < groups.length; i++) {
        ctx.sendMessage(`${msg}`, { chat_id: groups[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }).catch((err) => console.log(err));
      }
      const private = data.private;
      for (let i = 0; i < private.length; i++) {
        ctx.sendMessage(`${msg}`, { chat_id: private[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }).catch((err) => console.log(err));
      }
    } else {
      let data = fs.readFileSync("./data/groupData.json");
      data = JSON.parse(data);
      const groups = data.groups;
      for (let i = 0; i < groups.length; i++) {
        ctx
          .sendMessage(
            `*Twitter Bot!*\n\nOpenAI ERC's twitter bot is now live! You can use it by mentioning the account below followed by a statement or question!\n\nTwitter Bot: [@OpenAIChat_BOT](twitter.com/OpenAIChat_BOT)\n\n_7500$ for whoever gets a reply from Elon or Vitalik using the twitter bot (info). Also, 4000$ Big Buy Competition ends in 18 hours._\n\n${footerAdd}.`,
            { chat_id: groups[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }
          )
          .catch((err) => console.log(err));
      }
      const private = data.private;
      for (let i = 0; i < private.length; i++) {
        ctx
          .sendMessage(
            `*Twitter Bot!*\n\nOpenAI ERC's twitter bot is now live! You can use it by mentioning the account below followed by a statement or question!\n\nTwitter Bot: [@OpenAIChat_BOT](twitter.com/OpenAIChat_BOT)\n\n_7500$ for whoever gets a reply from Elon or Vitalik using the twitter bot (info). Also, 4000$ Big Buy Competition ends in 18 hours._\n\n${footerAdd}.`,
            { chat_id: private[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }
          )
          .catch((err) => console.log(err));
      }
      console.log("Broadcast done");
    }
  } catch (err) {}
};

module.exports = { broadcast };
