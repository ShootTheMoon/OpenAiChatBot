//Library Imports
require("dotenv").config();
const { Telegraf } = require("telegraf");
const fs = require("fs");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
var bodyParser = require("body-parser");

const moonsId = 2056782424;

// Global variables
const { TOKEN, SERVER_URL, BUILD, PORT } = process.env;

// Function Imports
const { chatHandler, getMetrics, blacklistGroup, chatBlacklistHandler, logChat } = require("./utils/groupHandlers");
const { sendCallHandler, sendWebhookImg } = require("./utils/messageHandlers");
const { profanityFilter } = require("./utils/profanityFilter");
const { setFooterAd, toggleFooterAd, getFooterAd } = require("./utils/footerHandlers");
const { broadcast } = require("./utils/broadcastMessage");
// const { broadcast } = require("./utils/broadcastMessage");

let serverUrl = SERVER_URL;
if (BUILD == "Test") {
  serverUrl = "https://8424-2601-589-4d80-16d0-f409-d6cc-170d-a436.ngrok.io";
}

let footerAd = getFooterAd();

const bot = new Telegraf(TOKEN);
const app = express();
app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.listen(4200, () => {
  console.log("Listening on port " + 4200);
});

app.post("/webhook", (req, res) => {
  if (req.body.id) {
    console.log(req.body.id);
    sendWebhookImg(req.body.id, req.body.imgUrl);
  }
});

// On /start
bot.start((ctx) => {
  try {
    ctx
      .reply(
        "*Welcome to the the EvolveAI ERC20 Bot!*\n\n_Use /ask followed by a question or statement to receive an AI-generated response via text.\nTo use /code, please read_ [this guide](https://beta.openai.com/docs/guides/code/introduction)_ on how to effective use code completion.\nUse /img followed by a depiction to receive an AI-generated image.\nUse /asks followed by a question or statement to receive an AI-generated response via speech.\nUse /speak followed text to convert text into speech.\nUse /askstats to request basic metrics regarding bot usage._\n\nTelegram: t.me/OpenAIERC \nTwitter: https://twitter.com/EvolveAIERC",
        { parse_mode: "Markdown" }
      )
      .catch((err) => console.log(err));
  } catch (err) {}
});

// On bot command
bot.command(async (ctx) => {
  try {
    const chatId = ctx.message.chat.id;
    const command = ctx.message.text;
    const messageId = ctx.message.message_id;
    // Check for profanity
    // Check if blacklisted
    if (ctx.update.message.photo) {
      // const caption = ctx.message.caption;
      // if (caption.split(" ")[0].toLowerCase() === "/img") {
      //   if (chatBlacklistHandler(chatId) != false) {
      //     return;
      //   }
      //   const input = caption.slice(5);
      //   // Check if command is empty
      //   if (!input) {
      //     ctx.reply(`*Please add a depiction after /img in order to generate an edited photo.*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      //   } else {
      //     // Check time restriction
      //     const [chatType, timeLeft] = chatHandler(ctx.message.chat);
      //     logChat(ctx, input);
      //     if (chatType === "group") {
      //       ctx.reply(`*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      //     } else if (chatType === "private") {
      //       ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      //     } else {
      //       // if (profanityFilter(input) === true) {
      //       //   ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      //       //   return;
      //       // }
      //       ctx
      //         .reply('*Choose an image style from below*\n\n_To add a negative prompt, at the END of your depiction add ":negative" followed what you wanted to exclude_', {
      //           parse_mode: "Markdown",
      //           disable_web_page_preview: true,
      //           reply_to_message_id: messageId,
      //           reply_markup: {
      //             inline_keyboard: [
      //               [
      //                 { text: "Standard", callback_data: "photreal" },
      //                 { text: "Anime", callback_data: "ani-punk" },
      //               ],
      //             ],
      //           },
      //         })
      //         .catch((err) => console.log(err));
      //     }
      //   }
      // }
    } else if (command.split(" ")[0].toLowerCase() === "/ask") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(5);
      // Check if command is empty
      if (!input) {
        ctx.reply(`*Use /ask followed by a question or statement to receive an AI-generated response via text*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 45 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          // if (profanityFilter(input) === true) {
          //   ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          //   return;
          // }
          sendCallHandler(ctx, input, "text");
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/code") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(6);
      // Check if command is empty
      if (!input) {
        ctx.reply(`*To use /code please read* [this guide](https://beta.openai.com/docs/guides/code/introduction) *on how to effective use code completion*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          // if (profanityFilter(input) === true) {
          //   ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          //   return;
          // }
          sendCallHandler(ctx, input, "code");
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/img") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(5);
      // Check if command is empty
      if (!input) {
        ctx.reply(`*Use /img followed by a depiction to receive an AI-generated image*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 45 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          // if (profanityFilter(input) === true) {
          //   ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          //   return;
          // }
          ctx
            .reply('*Choose an image style from below*\n\n_To add a negative prompt, at the END of your depiction add ":negative" followed what you wanted to exclude_', {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_to_message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Realistic", callback_data: "photreal" },
                    { text: "Open Journey", callback_data: "openjourney" },
                  ],
                  [
                    { text: "Anime Punk", callback_data: "ani-punk" },
                    { text: "Avatar", callback_data: "avatar" },
                  ],
                  [
                    { text: "Dream Shaper", callback_data: "dream-shaper" },
                    { text: "Snythwave", callback_data: "synth-wave" },
                  ],
                ],
              },
            })
            .catch((err) => console.log(err));
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/asks") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(6);
      if (!input) {
        ctx.reply(`*Use /asks followed by a question or statement to receive an AI-generated response via speech*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        // Check time restriction
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 15 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 45 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          console.log("ping");
          // if (profanityFilter(input) === true) {
          //   ctx.reply(`"_Given text violates OpenAI's Content Policy_"\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
          //   return;
          // }
          ctx
            .reply("_Choose voice options below_", {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_to_message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Male", callback_data: "maleVoice" },
                    { text: "Female", callback_data: "femaleVoice" },
                  ],
                ],
              },
            })
            .catch((err) => console.log(err));
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/speak") {
      if (chatBlacklistHandler(chatId) != false) {
        return;
      }
      const input = command.slice(7);
      if (!input) {
        ctx.reply(`*Use /speak followed text to convert text into speech*\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      } else {
        const [chatType, timeLeft] = chatHandler(ctx.message.chat);
        logChat(ctx, input);
        if (chatType === "group") {
          ctx.reply(`*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else if (chatType === "private") {
          ctx.reply(`*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
        } else {
          ctx
            .reply("_Choose voice options below_", {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_to_message_id: messageId,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "Male", callback_data: "maleVoice" },
                    { text: "Female", callback_data: "femaleVoice" },
                  ],
                ],
              },
            })
            .catch((err) => {});
        }
      }
    } else if (command.split(" ")[0].toLowerCase() === "/askstats") {
      const stats = getMetrics(chatId);
      ctx.reply(`${stats}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    } else if (command.split(" ")[0].toLowerCase() === "/askcreator") {
      ctx.reply(`@MoonDan1337`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
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
    } else if (command.split(" ")[0].toLowerCase() === "/broadcast" && ctx.message.from.id === moonsId) {
      const message = command.slice(11);
      broadcast(ctx, message);
      ctx.reply(`Broadcasting...`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    } else if (command.split(" ")[0].toLowerCase() === "/aski") {
      ctx.reply(`*/aski is no longer in use, please use /img instead*`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    }
  } catch (err) {
    console.log(err);
  }
});

// >- Callbacks -< \\

// American male voice
bot.action("maleVoice", (ctx) => {
  try {
    const messageId = ctx.update.callback_query.message.message_id;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      let input = ctx.update.callback_query.message.reply_to_message.text;
      if (input.split(" ")[0].toLowerCase() === "/speak") {
        input = input.slice(7);
        sendCallHandler([ctx, "male"], input, "audio");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else if (input.split(" ")[0].toLowerCase() === "/asks") {
        input = input.slice(6);
        sendCallHandler([ctx, "male"], input, "aiaudio");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    }
  } catch (err) {
    console.log(err);
  }
});

// American female voice
bot.action("femaleVoice", (ctx) => {
  try {
    const from = ctx.update.callback_query.from.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      let input = ctx.update.callback_query.message.reply_to_message.text;
      if (input.split(" ")[0].toLowerCase() === "/speak") {
        input = input.slice(7);
        sendCallHandler([ctx, "female"], input, "audio");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else if (input.split(" ")[0].toLowerCase() === "/asks") {
        input = input.slice(6);
        sendCallHandler([ctx, "female"], input, "aiaudio");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    }
  } catch (err) {
    console.log(err);
    ctx.answerCbQuery().catch((err) => {});
  }
});

// Animated diffusion model
bot.action("ani-punk", (ctx) => {
  try {
    const messageId = ctx.update.callback_query.message.message_id;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      if (ctx.update.callback_query.message.reply_to_message.caption) {
        let input = ctx.update.callback_query.message.reply_to_message.caption;
        input = input.slice(5);
        input = "ani-punk " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else {
        let input = ctx.update.callback_query.message.reply_to_message.text;
        input = input.slice(5);
        input = "ani-punk " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
    }
  } catch (err) {
    console.log(err);
  }
});

bot.action("openjourney", (ctx) => {
  try {
    const messageId = ctx.update.callback_query.message.message_id;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      if (ctx.update.callback_query.message.reply_to_message.caption) {
        let input = ctx.update.callback_query.message.reply_to_message.caption;
        input = input.slice(5);
        input = "openjourney " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else {
        let input = ctx.update.callback_query.message.reply_to_message.text;
        input = input.slice(5);
        input = "openjourney " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
    }
  } catch (err) {
    console.log(err);
  }
});

bot.action("avatar", (ctx) => {
  try {
    const messageId = ctx.update.callback_query.message.message_id;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      if (ctx.update.callback_query.message.reply_to_message.caption) {
        let input = ctx.update.callback_query.message.reply_to_message.caption;
        input = input.slice(5);
        input = "avatar " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else {
        let input = ctx.update.callback_query.message.reply_to_message.text;
        input = input.slice(5);
        input = "avatar " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
    }
  } catch (err) {
    console.log(err);
  }
});

bot.action("dream-shaper", (ctx) => {
  try {
    const messageId = ctx.update.callback_query.message.message_id;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      if (ctx.update.callback_query.message.reply_to_message.caption) {
        let input = ctx.update.callback_query.message.reply_to_message.caption;
        input = input.slice(5);
        input = "dream-shaper " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else {
        let input = ctx.update.callback_query.message.reply_to_message.text;
        input = input.slice(5);
        input = "dream-shaper " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
    }
  } catch (err) {
    console.log(err);
  }
});

bot.action("synth-wave", (ctx) => {
  try {
    const messageId = ctx.update.callback_query.message.message_id;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      if (ctx.update.callback_query.message.reply_to_message.caption) {
        let input = ctx.update.callback_query.message.reply_to_message.caption;
        input = input.slice(5);
        input = "synth-wave " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else {
        let input = ctx.update.callback_query.message.reply_to_message.text;
        input = input.slice(5);
        input = "synth-wave " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
    }
  } catch (err) {
    console.log(err);
  }
});

// Normal diffusion model
bot.action("photreal", (ctx) => {
  try {
    const chat = ctx.update.callback_query.message.chat;
    const messageId = ctx.update.callback_query.message.message_id;
    const from = ctx.update.callback_query.from.id;
    const creator = ctx.update.callback_query.message.reply_to_message.from.id;
    if (chatBlacklistHandler(ctx.update.callback_query.message.chat.id) != false) {
      ctx.answerCbQuery().catch((err) => {});
    } else if (from === creator) {
      if (ctx.update.callback_query.message.reply_to_message.caption) {
        let input = ctx.update.callback_query.message.reply_to_message.caption;
        input = input.slice(5);
        input = "photreal " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      } else {
        let input = ctx.update.callback_query.message.reply_to_message.text;
        input = input.slice(5);
        input = "photreal " + input;
        sendCallHandler(ctx, input, "image");
        ctx.deleteMessage(messageId).catch((err) => console.log(err));
      }
    } else {
      ctx.answerCbQuery().catch((err) => {});
    }
  } catch (err) {
    console.log(err);
  }
});

// Start webhook via launch method (preferred)
bot.launch({
  webhook: {
    domain: `${serverUrl}`,
    port: PORT,
    hookPath: `/app4/${TOKEN}`,
  },
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
