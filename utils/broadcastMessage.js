const fs = require("fs");

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const broadcast = async (ctx, msg = false) => {
  try {
    if (msg) {
      const messageId = ctx.message.message_id;
      let data = fs.readFileSync("./data/groupData.json");
      data = JSON.parse(data);
      const groups = data.groups;
      for (let i = 0; i < groups.length; i++) {
        ctx.sendMessage(`${msg}`, { chat_id: groups[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }).catch((err) => {});
        await timer(600);
      }
      const private = data.private;
      for (let i = 0; i < private.length; i++) {
        ctx.sendMessage(`${msg}`, { chat_id: private[i].chatId, disable_web_page_preview: true, parse_mode: "Markdown" }).catch((err) => {});
        await timer(600);
      }
      ctx.reply(`Broadcasting finished`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => {});
    }
  } catch (err) {}
};

module.exports = { broadcast };
