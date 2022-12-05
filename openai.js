//Library Imports
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

const moonsId = 2056782424;

// Global variables
const { TOKEN, SERVER_URL, BUILD, PORT } = process.env;

// Function Imports
const { generateImage, generateText } = require("./utils/generate");
const { sendMessage, sendPhoto } = require("./utils/sendResponse");
const { addNewPrivate, addNewGroup, getDetailedMetrics, getMetrics } = require("./utils/groupHandlers");
//Express
const app = express();
app.use(bodyParser.json());

//Webhook
let serverUrl = SERVER_URL;
if (BUILD == "Test") {
  serverUrl = "https://ea2b-2601-589-4d80-16d0-2172-e187-1fd2-b908.ngrok.io";
}
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/app4/${TOKEN}`;
const WEBHOOK_URL = serverUrl + URI;

const collectChatData = (chat) => {
  try {
    const type = chat.type;
    const id = chat.id;
    const title = chat.title;
    if (type === "private") {
      addNewPrivate(id, title);
    } else {
      addNewGroup(id, title, type);
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
        collectChatData(req.body.message.chat);
        if (question == "test" || question == "test?") {
          sendMessage(TELEGRAM_API, chatId, "*What exactly are you testing?*\n\n[Join OpenAI](http://t.me/OpenAIERC)", messageId);
        } else if (question == "is the dev based" || question == "is the dev based?" || question == "is dev based" || question == "is dev based?") {
          sendMessage(TELEGRAM_API, chatId, "The Open Ai ERC20 dev is a based chad \n\n[Join OpenAI](http://t.me/OpenAIERC)", messageId);
        } else if (question) {
          generateText(question).then((response) => {
            if (response != false) {
              sendMessage(TELEGRAM_API, chatId, `${response}\n\n[Join OpenAI](http://t.me/OpenAIERC)`, messageId);
            }
          });
        }
      } else if (command.split(" ")[0].toLowerCase() == "/aski") {
        const question = command.slice(6);
        collectChatData(req.body.message.chat);
        if (question) {
          generateImage(question).then((response) => {
            if (response != false) {
              console.log(response);
              sendPhoto(TELEGRAM_API, chatId, response, `${question}\n\n[Join OpenAI](http://t.me/OpenAIERC)`, messageId, false);
            } else {
              sendMessage(TELEGRAM_API, chatId, `*No*\n\n[Join OpenAI](http://t.me/OpenAIERC)`, messageId);
            }
          });
        }
      } else if (command.split(" ")[0].toLowerCase() == "/start") {
        sendMessage(TELEGRAM_API, chatId, "*Welcome to the the OpenAi ERC20 Bot, use /ask followed by a question or statement to generate a response or use /aski followed by a depiction to generate an image!*\n\nTelegram: t.me/OpenAIERC \nTwitter: https://twitter.com/OpenAIERC", messageId);
      } else if (command.split(" ")[0].toLowerCase() == "/askstats") {
        const text = getMetrics();
        sendMessage(TELEGRAM_API, chatId, text, messageId);
      } else if (command.split(" ")[0].toLowerCase() == "/dmetrics" && id === moonsId) {
        const text = getDetailedMetrics();
        sendMessage(TELEGRAM_API, chatId, text, messageId);
      }
    }
  } catch (err) {
    console.log(err);
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
