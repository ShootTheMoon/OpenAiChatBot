const { Configuration, OpenAIApi } = require("openai");
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
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: input,
        temperature: 1,
        max_tokens: 2056,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });
      return [response.data.choices[0].text, "text"];
    } else {
      return ["_Given text violates OpenAI's Content Policy_", "text"];
    }
  } catch (err) {
    return [false];
  }
};

const generateImage = async (input) => {
  try {
    const filter = false;
    if (filter == -false) {
      const response = await openai.createImage({
        prompt: input,
        n: 1,
        size: "512x512",
      });
      return [response.data.data[0].url, "image"];
    } else {
      return ["_Given text violates OpenAI's Content Policy_", "text"];
    }
  } catch (err) {
    console.log(err);
    return [false];
  }
};

const moderationFilter = async (text) => {
  try {
    const response = await openai.createModeration({
      input: text,
    });
    console.log(response);
    return response.data.results[0].flagged;
  } catch (err) {
    console.log(err.toJSON);
  }
};

module.exports = { generateText, generateImage };
