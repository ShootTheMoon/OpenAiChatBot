const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");
const { backOff } = require("exponential-backoff");
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const { OPENAI_KEY, STABILITY_AI_KEY } = process.env;
const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);
const client = new textToSpeech.TextToSpeechClient();

const generateText = async (input) => {
  try {
    console.log(input);
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
  } catch (err) {
    console.log(err);
    return [false];
  }
};

const generateImageNew = async (input) => {
  try {
    const response = await backOff(async () => {
      const response = await axios.post("https://stablediffusionapi.com/api/v3/text2img", {
        key: "zpON207pthXwqXvGsHfi6flGq1br6I0tfD1Wd8QHfvLAt0jRJFzVglz7yDyk",
        prompt: input,
        negative_prompt: "",
        width: "512",
        height: "512",
        samples: 1,
        num_inference_steps: "30",
        seed: null,
        guidance_scale: 7.5,
        webhook: null,
        track_id: null,
      });
      return response;
    });
    if (response.data.status === "processing") {
      const retry = () => {
        setTimeout(async () => {
          try {
            const res = await axios.post(`${response.data.fetch_result}`, { key: "zpON207pthXwqXvGsHfi6flGq1br6I0tfD1Wd8QHfvLAt0jRJFzVglz7yDyk" });
            if (res.data.status === "success") {
              console.log(res.data.output[0]);
              return [res.data.output[0]];
            }
            retry();
          } catch (err) {
            return [false];
          }
        }, 3000);
      };
      retry();
    } else if (response.data.status === "error") {
      return [false];
    } else {
      return [response.data.output[0]];
    }
  } catch (err) {
    console.log(err);
    return [false];
  }
};

const generateImage = async (input) => {
  try {
    const response = await backOff(async () => {
      return await openai.createImage({
        prompt: input,
        n: 1,
        size: "512x512",
      });
    });
    return [response.data.data[0].url];
  } catch (err) {
    console.log(err);
    return [false];
  }
};

const generateTextToSpeech = async (text, voice) => {
  try {
    const response = await backOff(async () => {
      const id = uuidv4();
      // The text to synthesize

      if (voice === "male") {
        voice = "en-US-Wavenet-B";
      } else if (voice === "female") {
        voice = "en-US-Wavenet-G";
      }

      // Construct the request
      const request = {
        input: { text: text },
        // Select the language and SSML voice gender (optional)
        voice: { languageCode: "en-US", name: voice },
        voice: { languageCode: "en-US", name: voice },
        // select the type of audio encoding
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1,
          pitch: 0,
        },
      };

      // Performs the text-to-speech request
      const [response] = await client.synthesizeSpeech(request);
      // Write the binary audio content to a local file
      const writeFile = util.promisify(fs.writeFile);
      await writeFile(`./audio/${id}.mp3`, response.audioContent, "binary");
      return `${id}.mp3`;
    });
    return response;
  } catch (err) {
    console.log("Audio Err:", err);
  }
};

const moderationFilter = async (text) => {
  try {
    const response = await backOff(async () => {
      return await openai.createModeration({
        input: text,
      });
    });
    return response.data.results;
  } catch (err) {
    return false;
  }
};

module.exports = { generateText, generateImage, moderationFilter, generateTextToSpeech, generateImageNew };
