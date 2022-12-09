//Library Imports
require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");

const MAX_SIZE = 3500;
const moonsId = 2056782424;

const openAiAd = "[Join OpenAI](http://t.me/OpenAIERC)";
const footerAdd = `[Join OpenAI](http://t.me/OpenAIERC) | [Chart](https://www.dextools.io/app/ether/pair-explorer/0x670b681d8acca37d7e12c43f9d5114f4543e50ff) | [Buy](https://app.uniswap.org/#/swap?outputCurrency=0x6A6AA13393B7d1100c00a57c76c39e8B6C835041)`;

// Global variables
const { TOKEN, SERVER_URL, BUILD, PORT } = process.env;

// Function Imports
const { generateImage, generateText } = require("./utils/generate");
const { chatHandler, sortData, getMetrics } = require("./utils/groupHandlers");
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
let serverUrl = SERVER_URL;
if (BUILD == "Test") {
  serverUrl = "https://3dd5-2601-589-4d80-16d0-b4bf-e19c-5fb7-7bbd.ngrok.io";
}

const bot = new Telegraf(TOKEN);

// Log all chat commands
const logChat = (ctx) => {
  try {
    const type = ctx.message.chat.type;
    if (type === "private") {
      fs.appendFile("./data/chatData.txt", `\nUser: @${ctx.message.chat.username} - Id: ${ctx.message.from.id} - Text: ${ctx.message.text}`, (err) => {});
    } else {
      fs.appendFile("./data/chatData.txt", `\nGroup: ${ctx.message.chat.title} - User: @${ctx.message.from.username} -Text: ${ctx.message.text}`, (err) => {});
    }
  } catch (err) {
    console.log(err);
  }
};

// Filter blacklisted chats
const chatBlacklistHandler = (id) => {
  let data = fs.readFileSync("./data/blacklistData.json", "utf-8");
  data = JSON.parse(data);
  const found = data.findIndex((chatId) => chatId === id);
  if (found === -1) {
    return false;
  }
  return true;
};

// Add to blacklist
const blacklistGroup = (id) => {
  let data = fs.readFileSync("./data/blacklistData.json", "utf-8");
  data = JSON.parse(data);

  const found = data.findIndex((chatId) => chatId === id);
  if (found === -1) {
    data.push(parseInt(id));
    fs.writeFileSync("./data/blacklistData.json", JSON.stringify(data));
    return "Chat Id added to blacklist";
  }
  return "Chat already blacklisted";
};

// On /start
bot.start((ctx) => {
  try {
    ctx
      .reply("*Welcome to the the OpenAi ERC20 Bot, use /ask followed by a question or statement to generate a response or use /aski followed by a depiction to generate an image!*\n\nTelegram: t.me/OpenAIERC \nTwitter: https://twitter.com/OpenAIERC", { parse_mode: "Markdown" })
      .catch((err) => console.log(err));
  } catch (err) {}
});
// On bot command
bot.command((ctx) => {
  try {
    const chatId = ctx.message.chat.id;
    const command = ctx.message.text;
    const messageId = ctx.message.message_id;
    // Check if blacklisted
    if (command.split(" ")[0].toLowerCase() === "/ask") {
      if (chatBlacklistHandler(chatId) === false) {
        const question = command.slice(5);
        // Check if command is empty
        if (!question) {
          ctx.reply(`*Use /ask followed by a question or statement to generate a response*\n\n${footerAdd}.`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          // Check time restriction
          const [chatType, timeLeft] = chatHandler(ctx.message.chat);
          logChat(ctx, question);
          if (chatType === "group") {
            ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAdd}.`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          } else if (chatType === "private") {
            ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}.`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          } else {
            generateText(question).then((response) => {
              if (response[1] === "text") {
                let start = 0;
                let end = MAX_SIZE;
                const msgAmount = response[0].length / MAX_SIZE;
                for (let i = 0; i < msgAmount; i++) {
                  setTimeout(() => {
                    ctx
                      .reply(
                        `${response[0]
                          .slice(start, end)
                          .replace("_", "\\_")
                          .replace("*", "\\*")
                          .replace("[", "\\[")
                          .replace("(", "\\(")
                          .replace(")", "\\(")
                          .replace("~", "\\~")
                          .replace("|", "\\|")
                          .replace(">", "\\>")
                          .replace(">", "\\>")
                          .replace("=", "\\=")}\n\n${footerAdd}`,
                        { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }
                      )
                      .catch((err) => console.log(err));
                    start = start + MAX_SIZE;
                    end = end + MAX_SIZE;
                  }, 100);
                }
              } else if (response[1] === "violation") {
                ctx.reply(`${response[0]}\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
              }
            });
          }
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/aski") {
      if (chatBlacklistHandler(chatId) === false) {
        const question = command.slice(6);
        // Check if command is empty
        if (!question) {
          ctx.reply(`*Use /aski followed by a depiction to generate an image*\n\n${footerAdd}.`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          // Check time restriction
          const [chatType, timeLeft] = chatHandler(ctx.message.chat);
          logChat(ctx, question);
          if (chatType === "group") {
            ctx.reply(`*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAdd}.`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          } else if (chatType === "private") {
            ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}.`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          } else {
            if (question) {
              generateImage(question).then((response) => {
                if (response[1] === "image") {
                  ctx.replyWithPhoto(response[0], { parse_mode: "Markdown", caption: `${question}\n\n${footerAdd}`, reply_to_message_id: messageId }).catch((err) => console.log(err));
                } else if (response[1] === "violation") {
                  console.log("violation");
                  ctx.reply(`${response[0]}\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
                }
              });
            }
          }
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/askstats") {
      const stats = getMetrics(chatId);
      ctx.reply(`${stats}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    } else if (command.split(" ")[0].toLowerCase() === "/askcreator") {
      ctx.reply(`@MoonRocket23`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    } else if (command.split(" ")[0].toLowerCase() === "/askblacklist" && ctx.message.from.id === moonsId) {
      const group = command.slice(14);
      const res = blacklistGroup(group);
      ctx.reply(`*${res}*`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    }
  } catch (err) {
    console.log(err);
  }
});

// Start webhook via launch method (preferred)
bot.launch({
  webhook: {
    // Public domain for webhook; e.g.: example.com
    domain: `${serverUrl}`,

    // Port to listen on; e.g.: 8080
    port: PORT,

    // path: "/artifactory",

    // // Optional path to listen for.
    // // `bot.secretPathComponent()` will be used by default
    hookPath: `/app4/${TOKEN}`,

    // // Optional secret to be sent back in a header for security.
    // // e.g.: `crypto.randomBytes(64).toString("hex")`
    // secretToken: randomAlphaNumericString,
  },
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
