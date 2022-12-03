//Library Imports
require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");

// Global variables
const { TOKEN, SERVER_URL, BUILD, PORT } = process.env;

// Function Imports
const { generate } = require("./utils/generate");
const { sendMessage } = require("./utils/sendResponse");
//Express
const app = express();
app.use(bodyParser.json());

//Webhook
let serverUrl = SERVER_URL;
if (BUILD == "Test") {
  serverUrl = "https://d657-2601-589-4d80-16d0-c17a-1adf-e13e-5716.ngrok.io";
}
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const URI = `/app4/${TOKEN}`;
const WEBHOOK_URL = serverUrl + URI;

app.post(URI, async (req, res) => {
  try {
    if (req.body.message.chat) {
      const chatId = req.body.message.chat.id;
      const command = req.body.message.text;
      const messageId = req.body.message.message_id;
      if (command.split(" ")[0] == "/ask") {
        const question = command.slice(5);
        if (question == "test" || question == "test?") {
          sendMessage(TELEGRAM_API, chatId, "*What exactly are you testing?*", messageId);
        } else if (question) {
          generate(question).then((response) => sendMessage(TELEGRAM_API, chatId, response, messageId));
        }
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
