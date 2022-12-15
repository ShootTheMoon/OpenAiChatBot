const fs = require("fs");

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const broadcast = async (ctx, msg = false) => {
  try {
    if (msg) {
      console.log("ping");
      let data = fs.readFileSync("./data/groupData.json");
      data = JSON.parse(data);
      const groups = data.groups;
      for (let i = 0; i < groups.length; i++) {
        console.log("ping group");
        ctx.sendMessage(`${msg}`, { chat_id: groups[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }).catch((err) => console.log(err));
        await timer(300);
      }
      const private = data.private;
      for (let i = 0; i < private.length; i++) {
        console.log("ping private");
        ctx.sendMessage(`${msg}`, { chat_id: private[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }).catch((err) => console.log(err));
        await timer(300);
      }
    }
  } catch (err) {}
};

module.exports = { broadcast };
