const fs = require("fs");
const { generateImage, generateText, moderationFilter, generateTextToSpeech } = require("./generate");
const { addToProfanityList } = require("./profanityFilter");
const { getFooterAd } = require("./footerHandlers");

let footerAd = getFooterAd();

const MAX_SIZE = 3500;

const reqQueueTxt = [];
const ctxQueueTxt = [];
const typeQueueTxt = [];
const reqQueueImg = [];
const ctxQueueImg = [];
const reqQueueAud = [];
const ctxQueueAud = [];

const sendCallHandler = async (ctx, input, type) => {
  footerAd = getFooterAd();
  if (type === "text" || type === "aiaudio") {
    reqQueueTxt.push(input);
    ctxQueueTxt.push(ctx);
    typeQueueTxt.push(type);
    if (reqQueueTxt.length >= 10) {
      const reqQueue = [...reqQueueTxt];
      const ctxQueue = [...ctxQueueTxt];
      const typeQueue = [...typeQueueTxt];
      reqQueueTxt.length = 0;
      ctxQueueTxt.length = 0;
      typeQueueTxt.length = 0;
      const flags = await moderationFilter(reqQueue);
      const resArray = await generateText(reqQueue);
      for (let i = 0; i < resArray[0].length; i++) {
        if (!flags[i].flagged) {
          if (typeQueue[i] === "text") {
            sendTextHandler(ctxQueue[i], resArray[0][i].text);
          } else if (typeQueue[i] === "aiaudio") {
            generateTextToSpeech(resArray[0][i].text, ctxQueue[i][1]).then((response) => {
              sendAudioHandler(response, ctxQueue[i][0]);
            });
          }
        } else {
          addToProfanityList(reqQueue[i]);
          sendTextHandler(ctxQueue[i], "_Given text violates OpenAI's Content Policy_");
        }
      }
    }
  } else if (type === "image") {
    reqQueueImg.push(input);
    ctxQueueImg.push(ctx);
    if (reqQueueImg.length >= 3) {
      const reqQueue = [...reqQueueImg];
      const ctxQueue = [...ctxQueueImg];
      reqQueueImg.length = 0;
      ctxQueueImg.length = 0;
      const flags = await moderationFilter(reqQueue);
      for (let i = 0; i < reqQueue.length; i++) {
        if (!flags[i].flagged) {
          generateImage(reqQueue[i], "male").then((response) => {
            sendImageHandler(response[0], reqQueue[i], ctxQueue[i]);
          });
        } else {
          addToProfanityList(reqQueue[i]);
          sendTextHandler(ctxQueue[i], "_Given text violates OpenAI's Content Policy_");
        }
      }
    }
  } else if (type === "audio") {
    reqQueueAud.push(input);
    ctxQueueAud.push(ctx);
    if (reqQueueAud.length >= 1) {
      const reqQueue = [...reqQueueAud];
      const ctxQueue = [...ctxQueueAud];
      reqQueueAud.length = 0;
      ctxQueueAud.length = 0;
      for (let i = 0; i < reqQueue.length; i++) {
        generateTextToSpeech(reqQueue[i], ctxQueue[i][1]).then((response) => {
          sendAudioHandler(response, ctxQueue[i][0]);
        });
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
          caption: `${caption}\n\n${footerAd}`,
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
        .catch(() => {});
    } else {
      const callbackType = ctx.update.callback_query.data;
      if (callbackType === "retryImg") {
        ctx
          .replyWithPhoto(photo, {
            parse_mode: "Markdown",
            caption: `${caption}\n\n${footerAd}`,
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
          .catch(() => {});
        ctx.answerCbQuery().catch(() => {});
      } else {
        ctx
          .replyWithPhoto(photo, {
            parse_mode: "Markdown",
            caption: `${caption}\n\n${footerAd}`,
            reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id,
          })
          .catch(() => {});
        ctx.answerCbQuery().catch(() => {});
      }
    }
  } catch (err) {
    ctx.answerCbQuery().catch(() => {});
  }
};

// Send out text responses
const sendTextHandler = (ctx, response) => {
  try {
    const messageId = ctx.message.message_id;
    let start = 0;
    let end = MAX_SIZE;
    if (response === "_Given text violates OpenAI's Content Policy_") {
      ctx.reply(`${response}\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
      return;
    }
    if (response) {
      const msgAmount = response.length / MAX_SIZE;
      for (let i = 0; i < msgAmount; i++) {
        setTimeout(() => {
          ctx
            .reply(`${response.slice(start, end).replace("_", "_").replace("*", "*").replace("[", "[")}\n\n${footerAd}`, {
              parse_mode: "Markdown",
              disable_web_page_preview: true,
              reply_to_message_id: messageId,
            })
            .catch(() =>
              ctx.reply(`${response.slice(start, end)}`, {
                disable_web_page_preview: true,
                reply_to_message_id: messageId,
              })
            )
            .catch(() => {
              ctx.reply(`_Err, Please try again_\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            });
          start = start + MAX_SIZE;
          end = end + MAX_SIZE;
        }, 100);
      }
    }
  } catch (err) {
    ctx.reply(`_Err, Please try again_\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    ctx.answerCbQuery().catch(() => {});
  }
};

const sendAudioHandler = (audio, ctx) => {
  try {
    const messageId = ctx.update.callback_query.message.reply_to_message.message_id;
    const name = ctx.update.callback_query.message.reply_to_message.from.first_name;
    ctx
      .replyWithAudio({ source: `./audio/${audio}` }, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId, title: name, caption: footerAd })
      .then(() => {
        fs.unlink(`./audio/${audio}`, () => {});
      })
      .catch((err) => console.log(err));
    ctx.answerCbQuery().catch((err) => {});
  } catch (err) {
    console.log(err);
    ctx.answerCbQuery().catch((err) => {});
  }
};

module.exports = { sendTextHandler, sendImageHandler, sendCallHandler };
