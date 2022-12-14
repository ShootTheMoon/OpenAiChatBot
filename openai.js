//Library Imports
require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");

const moonsId = 2056782424;

// Global variables
const { TOKEN, SERVER_URL, BUILD, PORT } = process.env;

// Function Imports
const { chatHandler, getMetrics } = require("./utils/groupHandlers");
const { sendCallHandler } = require("./utils/messageHandlers");
const { profanityFilter } = require("./utils/profanityFilter");
const { setFooterAd, toggleFooterAd, getFooterAd } = require("./utils/footerHandlers");
// const { broadcast } = require("./utils/broadcastMessage");

let serverUrl = SERVER_URL;
if (BUILD == "Test") {
  serverUrl = "https://9c57-2601-5ca-c300-47f0-48d3-6159-a26c-8d6a.ngrok.io";
}

let footerAd = getFooterAd();

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

bot.action("enhanceImg", (ctx) => {
  try {
    const chat = ctx.update.callback_query.message.chat;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      const [chatType, timeLeft] = chatHandler(chat);
      if (chatType === "group") {
        ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery().catch((err) => {});
      } else if (chatType === "private") {
        ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery().catch((err) => {});
      } else {
        let message = ctx.update.callback_query.message.reply_to_message.text;
        message = message.slice(6);
        message += ", ultra realistic, 4k, intricate details,abstract, full hd render + 3d octane render +4k UHD + immense detail + dramatic lighting + well lit + black, purple, blue, pink, cerulean, teal, metallic colours, + fine details + octane render + 8k";
        sendCallHandler(ctx, message, "image");
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
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
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      const [chatType, timeLeft] = chatHandler(chat);
      if (chatType === "group") {
        ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery().catch((err) => {});
      } else if (chatType === "private") {
        ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery().catch((err) => {});
      } else {
        let message = ctx.update.callback_query.message.reply_to_message.text;
        message = message.slice(6);
        message += ", in a vaporwave style, as pixel art, in a photorealistic style";
        sendCallHandler(ctx, message, "image");
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
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
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      const [chatType, timeLeft] = chatHandler(chat);
      if (chatType === "group") {
        ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery().catch((err) => {});
      } else if (chatType === "private") {
        ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id }).catch((err) => console.log(err));
        ctx.answerCbQuery().catch((err) => {});
      } else {
        let message = ctx.update.callback_query.message.reply_to_message.text;
        message = message.slice(6);
        sendCallHandler(ctx, message, "image");
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
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
      const input = command.slice(5);
      // Check if command is empty
      if (!input) {
        ctx.reply(`*Use /ask followed by a question or statement to generate a response*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          if (profanityFilter(input) === true) {
            ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            return;
          }
          sendCallHandler(ctx, input, "text");
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/aski") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(6);
      // Check if command is empty
      if (!input) {
        ctx.reply(`*Use /aski followed by a depiction to generate an image*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          if (profanityFilter(input) === true) {
            ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            return;
          }
          sendCallHandler(ctx, input, "image");
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/asks") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(6);
      if (!input) {
        ctx.reply(`*Use /asks followed by a question or statement to generate a audio response*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          if (profanityFilter(input) === true) {
            ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            return;
          }
          sendCallHandler(ctx, input, "aiaudio");
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/speak") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(7);
      if (!input) {
        ctx.reply(`*Use /speak followed text to convert into audio*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        sendCallHandler(ctx, input, "audio");
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
    } else if (command.split(" ")[0].toLowerCase() === "/ads" && ctx.message.from.id === moonsId) {
      const message = command.slice(5);
      const res = toggleFooterAd(message);
      footerAd = getFooterAd();
      if (res) {
        ctx.reply(`*${res}*`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      }
    } else if (command.split(" ")[0].toLowerCase() === "/setad" && ctx.message.from.id === moonsId) {
      const message = command.slice(7);
      setFooterAd(message);
      footerAd = getFooterAd();
      ctx.reply(`This is how your ad will look when it is live!\n\nAd: ${message}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
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
