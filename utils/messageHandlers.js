const fs = require("fs");
const axios = require("axios");
const { generateImage, generateText, moderationFilter, generateTextToSpeech, generateImage2Image, generateCode } = require("./generate");
const { addToProfanityList } = require("./profanityFilter");
const { getFooterAd } = require("./footerHandlers");

let footerAd = getFooterAd();

const MAX_SIZE = 3500;
const moonsId = 2056782424;

const reqQueueTxt = [];
const ctxQueueTxt = [];
const typeQueueTxt = [];
const reqQueueImg = [];
const ctxQueueImg = [];
const reqQueueAud = [];
const ctxQueueAud = [];
const reqQueueCode = [];
const ctxQueueCode = [];

const sendCallHandler = async (ctx, input, type) => {
  footerAd = getFooterAd();
  if (type === "text" || type === "aiaudio") {
    reqQueueTxt.push(input);
    ctxQueueTxt.push(ctx);
    typeQueueTxt.push(type);
    if (reqQueueTxt.length >= 4) {
      const reqQueue = [...reqQueueTxt];
      const ctxQueue = [...ctxQueueTxt];
      const typeQueue = [...typeQueueTxt];
      reqQueueTxt.length = 0;
      ctxQueueTxt.length = 0;
      typeQueueTxt.length = 0;
      const flags = await moderationFilter(reqQueue);
      const rQueue = [];
      const cQueue = [];
      const tQueue = [];
      for (let i = 0; i < reqQueue.length; i++) {
        if (!flags[i].flagged) {
          rQueue.push(reqQueue[i]);
          cQueue.push(ctxQueue[i]);
          tQueue.push(typeQueue[i]);
        } else {
          addToProfanityList(reqQueue[i]);
          sendTextHandler(ctxQueue[i], "_Given text violates OpenAI's Content Policy_");
        }
      }
      if (rQueue.length > 0) {
        const resArray = await generateText(rQueue);
        for (let i = 0; i < resArray.length; i++) {
          if (tQueue[i] === "text") {
            sendTextHandler(cQueue[i], resArray[i].text);
          } else if (tQueue[i] === "aiaudio") {
            generateTextToSpeech(resArray[i].text, cQueue[i][1]).then((response) => {
              sendAudioHandler(response, cQueue[i][0]);
            });
          }
        }
      }
    }
  } else if (type === "code") {
    reqQueueCode.push(input);
    ctxQueueCode.push(ctx);
    if (reqQueueCode.length >= 1) {
      const reqQueue = [...reqQueueCode];
      const ctxQueue = [...ctxQueueCode];
      reqQueueCode.length = 0;
      ctxQueueCode.length = 0;
      const flags = await moderationFilter(reqQueue);
      const rQueue = [];
      const cQueue = [];
      for (let i = 0; i < reqQueue.length; i++) {
        if (!flags[i].flagged) {
          rQueue.push(reqQueue[i]);
          cQueue.push(ctxQueue[i]);
        } else {
          addToProfanityList(reqQueue[i]);
          sendTextHandler(ctxQueue[i], "_Given text violates OpenAI's Content Policy_");
        }
      }
      if (rQueue.length > 0) {
        const resArray = await generateCode(rQueue);
        for (let i = 0; i < resArray.length; i++) {
          sendTextHandler(cQueue[i], resArray[i].text);
        }
      }
    }
  } else if (type === "image") {
    reqQueueImg.push(input);
    ctxQueueImg.push(ctx);
    if (reqQueueImg.length >= 1) {
      const reqQueue = [...reqQueueImg];
      const ctxQueue = [...ctxQueueImg];
      reqQueueImg.length = 0;
      ctxQueueImg.length = 0;
      const flags = await moderationFilter(reqQueue);
      for (let i = 0; i < reqQueue.length; i++) {
        const model = reqQueue[i].split(" ")[0];
        const request = reqQueue[i].slice(model.length + 1);
        if (ctxQueue[i].update.callback_query.message.reply_to_message.caption) {
          const url = ctxQueue[i].update.callback_query.message.reply_to_message.photo[0].file_id;
          ctxQueue[i].telegram.getFileLink(url).then((img) => {
            generateImage2Image(request, model, img.href)
              .then((response) => {
                if (response) {
                  sendImageHandler(response, request, ctxQueue[i]);
                } else {
                  sendTextHandlerMoon(ctxQueue[i], "Error with image generation");
                }
              })
              .catch((err) => console.log(err));
          });
        } else {
          if (!flags[i].flagged) {
            console.log(request, ctx.update.callback_query.from.id);
            generateImage(request, model).then((response) => {
              if (response) {
                sendImageHandler(response, request, ctxQueue[i]);
              }
            });
          } else {
            addToProfanityList(reqQueue[i]);
            sendTextHandler(ctxQueue[i], "_Given text violates OpenAI's Content Policy_");
          }
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

const sendImageHandler = async (photo, caption, ctx, tries = 0) => {
  try {
    const callbackType = ctx.update.callback_query.data;
    ctx
      .replyWithPhoto(photo, {
        parse_mode: "Markdown",
        caption: `${caption}\n\n${footerAd}`,
        reply_to_message_id: ctx.update.callback_query.message.reply_to_message.message_id,
      })
      .catch((err) => {
        console.log("again", tries);
        if (tries < 2) {
          setTimeout(async () => {
            sendImageHandler(photo, caption, ctx, ++tries);
          }, 15000);
        }
        ctx.answerCbQuery().catch(() => {});
      });
    ctx.answerCbQuery().catch(() => {});
  } catch (err) {
    console.log(err);
    ctx.answerCbQuery().catch(() => {});
  }
};
// Send out text responses
const sendTextHandler = (ctx, response) => {
  try {
    let start = 0;
    let end = MAX_SIZE;
    try {
      const messageId = ctx.message.message_id;
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
              .catch(() => {});
            start = start + MAX_SIZE;
            end = end + MAX_SIZE;
          }, 100);
        }
      }
    } catch {
      try {
        messageId = ctx.update.callback_query.message.reply_to_message.message_id;
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
                .catch(() => {});
              start = start + MAX_SIZE;
              end = end + MAX_SIZE;
            }, 100);
          }
        }
      } catch (err) {
        try {
          ctx = ctx[0];
          messageId = ctx.update.callback_query.message.reply_to_message.message_id;
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
                  .catch(() => {});
                start = start + MAX_SIZE;
                end = end + MAX_SIZE;
              }, 100);
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    }
  } catch (err) {
    console.log(err);
    try {
      ctx.answerCbQuery().catch((err) => {
        console.log(err);
      });
    } catch (err) {}
  }
};
const sendTextHandlerMoon = (ctx, response) => {
  try {
    let start = 0;
    let end = MAX_SIZE;
    if (response === "_Given text violates OpenAI's Content Policy_") {
      ctx.reply(`${response}\n\n${footerAd}`, { chat_id: moonsId, parse_mode: "Markdown", disable_web_page_preview: true }).catch((err) => console.log(err));
      return;
    }
    if (response) {
      const msgAmount = response.length / MAX_SIZE;
      for (let i = 0; i < msgAmount; i++) {
        setTimeout(() => {
          ctx
            .reply(`${response.slice(start, end).replace("_", "_").replace("*", "*").replace("[", "[")}\n\n${footerAd}`, {
              chat_id: moonsId,
              parse_mode: "Markdown",
              disable_web_page_preview: true,
            })
            .catch(() =>
              ctx.reply(`${response.slice(start, end)}`, {
                chat_id: moonsId,
                disable_web_page_preview: true,
              })
            )
            .catch(() => {});
          start = start + MAX_SIZE;
          end = end + MAX_SIZE;
        }, 100);
      }
    }
  } catch (err) {
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
