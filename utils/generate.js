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
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: input,
      temperature: 1,
      max_tokens: 2056,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    return response.data.choices[0].text;
  } catch (err) {
    return false;
  }
};

const generateImage = async (input) => {
  try {
    const response = await openai.createImage({
      prompt: input,
      n: 1,
      size: "512x512",
    });
    return response.data.data[0].url;
  } catch (err) {
    console.log(err);
    return false;
  }
};

module.exports = { generateText, generateImage };
