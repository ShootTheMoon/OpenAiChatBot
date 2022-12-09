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
    const filter = await moderationFilter(input);
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
      return ["_Given text violates OpenAI's Content Policy_", "violation"];
    }
  } catch (err) {
    console.log("Text Generation Error");
    return [false];
  }
};

const generateImage = async (input) => {
  try {
    const filter = await moderationFilter(input);
    if (filter === false) {
      const response = await openai.createImage({
        prompt: input,
        n: 1,
        size: "512x512",
      });
      return [response.data.data[0].url, "image"];
    } else {
      return ["_Given text violates OpenAI's Content Policy_", "violation"];
    }
  } catch (err) {
    console.log("Image Generation Error");
    return [false];
  }
};

const moderationFilter = async (text) => {
  try {
    response = await openai.createModeration({
      input: text,
    });
    if (response.data.results[0].flagged == true) {
      return true;
    }
    return false;
  } catch (err) {
    console.log("Moderation Filter Error");
    return false;
  }
};

module.exports = { generateText, generateImage };
