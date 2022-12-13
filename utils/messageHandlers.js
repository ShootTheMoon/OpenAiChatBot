const fs = require("fs");
const { generateImage, generateText, moderationFilter } = require("./generate");
const { addToProfanityList } = require("./profanityFilter");

const MAX_SIZE = 3500;

const reqQueueTxt = [];
const ctxQueueTxt = [];
const reqQueueImg = [];
const ctxQueueImg = [];

const openAiAd = "[Join OpenAI](http://t.me/OpenAIERC) | [Chart](https://www.dextools.io/app/en/ether/pair-explorer/0x670b681d8acca37d7e12c43f9d5114f4543e50ff) | [Buy](https://app.uniswap.org/#/swap?outputCurrency=0x6A6AA13393B7d1100c00a57c76c39e8B6C835041)";
let footerAd = "";

const getFooterAd = () => {
  let data = fs.readFileSync("./data/footerAd.json", "utf-8");
  data = JSON.parse(data);
  if (data.enabled) {
    footerAd = "Ad: " + data.text;
  } else {
    footerAd = openAiAd;
  }
};

const sendCallHandler = async (ctx, question, type) => {
  getFooterAd();
  if (type === "text") {
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
        .catch((err) => {
          console.log(err);
        });
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
          .catch((err) => {
            console.log(err);
          });
        ctx.answerCbQuery().catch((err) => {});
      } else {
        ctx
          .replyWithPhoto(photo, {
            parse_mode: "Markdown",
            caption: `${caption}\n\n${footerAd}`,
            reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id,
          })
          .catch((err) => {
            console.log(err);
          });
        ctx.answerCbQuery().catch((err) => {});
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
            .catch((err) =>
              ctx.reply(`${response.slice(start, end)}`, {
                disable_web_page_preview: true,
                reply_to_message_id: messageId,
              })
            )
            .catch((err) => {
              ctx.reply(`_Err, Please try again_\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
            });
          start = start + MAX_SIZE;
          end = end + MAX_SIZE;
        }, 100);
      }
    }
  } catch (err) {
    ctx.reply(`_Err, Please try again_\n\n${footerAd}`, { parse_mode: "Markdown", disable_web_page_preview: true, reply_to_message_id: messageId }).catch((err) => console.log(err));
    console.log(err);
  }
};

module.exports = { sendTextHandler, sendImageHandler, sendCallHandler };
