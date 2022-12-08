//Library Imports
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const moonsId = 2056782424;
const chatLogsId = -1001843299957;
const openAiAd = "[Join OpenAI](http://t.me/OpenAIERC)";
const footerAdd = `Ad: [SNOWBALL JACKPOT](https://t.me/snowballbsc_official) [📊](https://www.dextools.io/app/en/bnb/pair-explorer/0xc673ef8a48ab012af74b0023bcc20962111c558b)\n${openAiAd}`;

// Global variables
const { TOKEN, SERVER_URL, BUILD, PORT } = process.env;

// Function Imports
const { generateImage, generateText } = require("./utils/generate");
const { sendMessage, sendPhoto } = require("./utils/sendResponse");
const { chatHandler, sortData, getMetrics } = require("./utils/groupHandlers");
//Express
const app = express();
app.use(bodyParser.json());

//Webhook
let serverUrl = SERVER_URL;
if (BUILD == "Test") {
  serverUrl = "https://660b-2601-589-4d80-16d0-9539-dff9-7fa0-13a8.ngrok.io";
}
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/app4/${TOKEN}`;
const WEBHOOK_URL = serverUrl + URI;

const logChat = (req) => {
  try {
    const type = req.body.message.chat.type;
    if (type === "private") {
      sendMessage(TELEGRAM_API, chatLogsId, `User: @${req.body.message.chat.username}\nText: ${req.body.message.text}`);
    } else {
      sendMessage(TELEGRAM_API, chatLogsId, `Group: ${req.body.message.chat.title}\nUser: @${req.body.message.from.username}\nText: ${req.body.message.text}`);
    }
  } catch (err) {
    console.log(err);
  }
};

app.post(URI, async (req, res) => {
  try {
    if (req.body.message.chat) {
      const chatId = req.body.message.chat.id;
      const command = req.body.message.text;
      const messageId = req.body.message.message_id;
      const id = req.body.message.from.id;
      if (command.split(" ")[0].toLowerCase() == "/ask") {
        const question = command.slice(5);
        if (!question) {
          sendMessage(TELEGRAM_API, chatId, `*Use /ask followed by a question or statement to generate a response*\n\n${footerAdd}`, messageId);
        } else {
          const [chatType, timeLeft] = chatHandler(req.body.message.chat);
          // logChat(req, question);
          if (chatType === "group") {
            sendMessage(TELEGRAM_API, chatId, `*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, messageId);
          } else if (chatType === "private") {
            sendMessage(TELEGRAM_API, chatId, `*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, messageId);
          } else {
            if (question == "test" || question == "test?") {
              sendMessage(TELEGRAM_API, chatId, `*What exactly are you testing?*\n\n${footerAdd}`, messageId);
            } else if (question == "is the dev based" || question == "is the dev based?" || question == "is dev based" || question == "is dev based?") {
              sendMessage(TELEGRAM_API, chatId, `The Open Ai ERC20 dev is a based chad \n\n${footerAdd}`, messageId);
            } else if (question) {
              generateText(question).then((response) => {
                if (response[0] != false) {
                  sendMessage(TELEGRAM_API, chatId, `${response[0]}\n\n${footerAdd}`, messageId);
                }
              });
            }
          }
        }
      } else if (command.split(" ")[0].toLowerCase() == "/aski") {
        const question = command.slice(6);
        if (!question) {
          sendMessage(TELEGRAM_API, chatId, `*Use /aski followed by a depiction to generate an image*\n\n${footerAdd}`, messageId);
        } else {
          const [chatType, timeLeft] = chatHandler(req.body.message.chat);
          // logChat(req, question);
          if (chatType === "group") {
            sendMessage(TELEGRAM_API, chatId, `*Request are limited to 1 request per 10 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, messageId);
          } else if (chatType === "private") {
            sendMessage(TELEGRAM_API, chatId, `*Request are limited to 1 request per 30 seconds *(${timeLeft}s remaining)\n\n${footerAdd}`, messageId);
          } else {
            if (question) {
              generateImage(question).then((response) => {
                if (response[0] != false) {
                  if (response[1] === "image") {
                    sendPhoto(TELEGRAM_API, chatId, response[0], `${question}\n\n${footerAdd}`, messageId, false);
                  } else {
                    sendMessage(TELEGRAM_API, chatId, `${response[0]}\n\n${footerAdd}`, messageId);
                  }
                }
              });
            }
          }
        }
      } else if (command.split(" ")[0].toLowerCase() == "/start") {
        sendMessage(TELEGRAM_API, chatId, "*Welcome to the the OpenAi ERC20 Bot, use /ask followed by a question or statement to generate a response or use /aski followed by a depiction to generate an image!*\n\nTelegram: t.me/OpenAIERC \nTwitter: https://twitter.com/OpenAIERC", messageId);
      } else if (command.split(" ")[0].toLowerCase() == "/askstats") {
        const text = getMetrics(chatId);
        sendMessage(TELEGRAM_API, chatId, text, messageId);
      } else if (command.split(" ")[0].toLowerCase() == "/asksort" && id === moonsId) {
        sortData();
      } else if (command.split(" ")[0].toLowerCase() == "/askcreator") {
        sendMessage(TELEGRAM_API, chatId, "@MoonRocket23", messageId);
      }
    }
  } catch (err) {
    // console.log(err);
  }
  return res.send();
});

app.listen(PORT || 5000, () => {
  console.log("🚀 app running on port", PORT || 5000);

  // Delete and unsubscribe to webhook events
  axios.get(`${TELEGRAM_API}/deleteWebhook?drop_pending_updates=true`).then((res) => {
    console.log(res.data);
    // Subscribe to webhook events
    axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`).then((res) => {
      console.log(res.data);
    });
  });
});
