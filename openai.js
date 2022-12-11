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
const { generateImage, generateText, moderationFilter } = require("./utils/generate");
const { chatHandler, sortData, getMetrics } = require("./utils/groupHandlers");
const { profanityFilter, addToProfanityList } = require("./utils/profanityFilter");
const { broadcast } = require("./utils/broadcastMessage");
const { Console } = require("console");

let serverUrl = SERVER_URL;
if (BUILD == "Test") {
  serverUrl = "https://1287-2601-5ca-c300-47f0-dc00-8282-dae3-6c68.ngrok.io";
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

const reqQueueTxt = [];
const ctxQueueTxt = [];
const reqQueueImg = [];
const ctxQueueImg = [];
const sendCallHandler = async (ctx, question, type) => {
  if (type === "text") {
    console.log(question);
    reqQueueTxt.push(question);
    ctxQueueTxt.push(ctx);
    if (reqQueueTxt.length >= 5) {
      const reqQueue = [...reqQueueTxt];
      const ctxQueue = [...ctxQueueTxt];
      reqQueueTxt.length = 0;
      ctxQueueTxt.length = 0;
      const flags = await moderationFilter(reqQueue);
      const resArray = await generateText(reqQueue);
      for (let i = 0; i < resArray[0].length; i++) {
        if (!flags[i].flagged) {
          sendTextHandler(ctxQueue[i], resArray[0][i].text);
        } else {
          addToProfanityList(reqQueue[i]);
          sendTextHandler(ctxQueue[i], "_Given text violates OpenAI's Content Policy_");
        }
      }
    }
  } else if (type === "image") {
    reqQueueImg.push(question);
    ctxQueueImg.push(ctx);
    if (reqQueueImg.length >= 3) {
      const reqQueue = [...reqQueueImg];
      const ctxQueue = [...ctxQueueImg];
      reqQueueImg.length = 0;
      ctxQueueImg.length = 0;
      const flags = await moderationFilter(reqQueue);
      for (let i = 0; i < reqQueue.length; i++) {
        if (!flags[i].flagged) {
          generateImage(reqQueue[i]).then((response) => {
            sendImageHandler(response[0], reqQueue[i], ctxQueue[i]);
          });
        } else {
          addToProfanityList(reqQueue[i]);
          sendTextHandler(ctxQueue[i], "_Given text violates OpenAI's Content Policy_");
        }
      }
    }
  }
};

const sendImageHandler = (photo, caption, ctx) => {
  try {
    if (ctx.message) {
      ctx
        .replyWithPhoto(photo, {
          parse_mode: "Markdown",
          caption: `${caption}\n\n${footerAdd}`,
          reply_to_message_id: ctx.message.message_id,
          reply_markup: {
            inline_keyboard: [
              [
                { text: "Retry", callback_data: "retryImg" },
                { text: "Enhance", callback_data: "enhanceImg" },
                { text: "Pixelate", callback_data: "pixelateImg" },
              ],
            ],
          },
        })
        .catch((err) => {
          console.log(err);
        });
    } else {
      const callbackType = ctx.update.callback_query.data;
      if (callbackType === "retryImg") {
        ctx
          .replyWithPhoto(photo, {
            parse_mode: "Markdown",
            caption: `${caption}\n\n${footerAdd}`,
            reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id,
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "Retry", callback_data: "retryImg" },
                  { text: "Enhance", callback_data: "enhanceImg" },
                  { text: "Pixelate", callback_data: "pixelateImg" },
                ],
              ],
            },
          })
          .catch((err) => {
            console.log(err);
          });
        ctx.answerCbQuery();
      } else {
        ctx
          .replyWithPhoto(photo, {
            parse_mode: "Markdown",
            caption: `${caption}\n\n${footerAdd}`,
            reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id,
          })
          .catch((err) => {
            console.log(err);
          });
        ctx.answerCbQuery();
      }
    }
  } catch (err) {}
};

// Send out text responses
const sendTextHandler = (ctx, response) => {
  try {
    const messageId = ctx.message.message_id;
    let start = 0;
    let end = MAX_SIZE;
    if (response === "_Given text violates OpenAI's Content Policy_") {
      ctx.reply(`${response}\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      return;
    }
    if (response) {
      const msgAmount = response.length / MAX_SIZE;
      for (let i = 0; i < msgAmount; i++) {
        setTimeout(() => {
          ctx
            .reply(`${response.slice(start, end).replace("_", "_").replace("*", "*").replace("[", "[")}\n\n${footerAdd}`, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_to_message_id: messageId,
            })
            .catch((err) =>
              ctx.reply(`${response.slice(start, end)}`, {
                disable_web_page_preview: true,
                reply_to_message_id: messageId,
              })
            )
            .catch((err) => {
              ctx.reply(`_Err, Please try again_\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            });
          start = start + MAX_SIZE;
          end = end + MAX_SIZE;
        }, 100);
      }
    }
  } catch (err) {
    ctx.reply(`_Err, Please try again_\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    console.log(err);
  }
};

// On /start
bot.start((ctx) => {
  try {
    ctx
      .reply("*Welcome to the the OpenAi ERC20 Bot, use /ask followed by a question or statement to generate a response or use /aski followed by a depiction to generate an image!*\n\nTelegram: t.me/OpenAIERC \nTwitter: https://twitter.com/OpenAIERC", { parse_mode: "Markdown" })
      .catch((err) => console.log(err));
  } catch (err) {}
});

bot.action("enhanceImg", (ctx) => {
  try {
    const chat = ctx.update.callback_query.message.chat;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery();
    } else if (from === creator) {
      const [chatType, timeLeft] = chatHandler(chat);
      if (chatType === "group") {
        ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery();
      } else if (chatType === "private") {
        ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery();
      } else {
        let message = ctx.update.callback_query.message.reply_to_message.text;
        message = message.slice(6);
        message += ", ultra realistic, 4k, intricate details,abstract, full hd render + 3d octane render +4k UHD + immense detail + dramatic lighting + well lit + black, purple, blue, pink, cerulean, teal, metallic colours, + fine details + octane render + 8k";
        sendCallHandler(ctx, message, "image");
      }
    } else {
      ctx.answerCbQuery();
    }
  } catch (err) {
    console.log(err);
  }
});

bot.action("pixelateImg", (ctx) => {
  try {
    const chat = ctx.update.callback_query.message.chat;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery();
    } else if (from === creator) {
      const [chatType, timeLeft] = chatHandler(chat);
      if (chatType === "group") {
        ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery();
      } else if (chatType === "private") {
        ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery();
      } else {
        let message = ctx.update.callback_query.message.reply_to_message.text;
        message = message.slice(6);
        message += ", in a vaporwave style, as pixel art, in a photorealistic style";
        sendCallHandler(ctx, message, "image");
      }
    } else {
      ctx.answerCbQuery();
    }
  } catch (err) {
    console.log(err);
  }
});

bot.action("retryImg", (ctx) => {
  try {
    const chat = ctx.update.callback_query.message.chat;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery();
    } else if (from === creator) {
      const [chatType, timeLeft] = chatHandler(chat);
      if (chatType === "group") {
        ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery();
      } else if (chatType === "private") {
        ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery();
      } else {
        let message = ctx.update.callback_query.message.reply_to_message.text;
        message = message.slice(6);
        sendCallHandler(ctx, message, "image");
      }
    } else {
      ctx.answerCbQuery();
    }
  } catch (err) {
    console.log(err);
  }
});

// On bot command
bot.command((ctx) => {
  try {
    const chatId = ctx.message.chat.id;
    const command = ctx.message.text;
    const messageId = ctx.message.message_id;
    // Check for profanity
    // Check if blacklisted
    if (command.split(" ")[0].toLowerCase() === "/ask") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const question = command.slice(5);
      // Check if command is empty
      if (!question) {
        ctx.reply(`*Use /ask followed by a question or statement to generate a response*\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, question);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          if (profanityFilter(question) === true) {
            ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            return;
          }
          sendCallHandler(ctx, question, "text");
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/aski") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const question = command.slice(6);
      // Check if command is empty
      if (!question) {
        ctx.reply(`*Use /aski followed by a depiction to generate an image*\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, question);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          if (profanityFilter(question) === true) {
            ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAdd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            return;
          }
          sendCallHandler(ctx, question, "image");
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
    //  else if (command.split(" ")[0].toLowerCase() === "/broadcast" && ctx.message.from.id === moonsId) {
    //   const message = command.slice(11);
    //   broadcast(ctx, message);
    // }
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
