const { Configuration, OpenAIApi } = require("openai");
const { backOff } = require("exponential-backoff");
const { response } = require("express");
require("dotenv").config();

const { OPENAI_KEY } = process.env;
console.log(OPENAI_KEY);
const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const generateText = async (input) => {
  try {
    const filter = false;
    if (filter === false) {
      const response = await backOff(async () => {
        return await openai.createCompletion({
          model: "text-davinci-003",
          prompt: input,
          temperature: 1,
          max_tokens: 1500,
          top_p: 1,
          frequency_penalty: 0.5,
          presence_penalty: 0.5,
        });
      });
      return [response.data.choices];
    } else {
      return ["_Given text violates OpenAI's Content Policy_"];
    }
  } catch (err) {
    return [false];
  }
};

const generateImage = async (input) => {
  try {
    const filter = false;
    if (filter === false) {
      const response = await backOff(async () => {
        return await openai.createImage({
          prompt: input,
          n: 1,
          size: "512x512",
        });
      });
      return [response.data.data[0].url];
    } else {
      return ["_Given text violates OpenAI's Content Policy_"];
    }
  } catch (err) {
    return [false];
  }
};

const moderationFilter = async (text) => {
  try {
    console.log(text);
    const response = await backOff(async () => {
      return await openai.createModeration({
        input: text,
      });
    });
    return response.data.results;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports = { generateText, generateImage, moderationFilter };
