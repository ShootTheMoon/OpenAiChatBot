const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();
const { OPENAI_KEY } = process.env;
console.log(OPENAI_KEY);
const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);

const generate = async (input) => {
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
};

module.exports = { generate };
