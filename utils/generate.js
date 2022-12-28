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
    return response.data.choices;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const generateCode = async (input) => {
  try {
    console.log(input);
    const response = await backOff(async () => {
      return await openai.createCompletion({
        model: "code-davinci-002",
        prompt: input,
        temperature: 0.5,
        max_tokens: 1000,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
      });
    });
    console.log(response.data.choices);
    return response.data.choices;
  } catch (err) {
    console.log(err);
    return false;
  }
};

const generateImage = async (input, model) => {
  try {
    const negativePrompt = input.split(":negative ")[1];
    const response = await backOff(async () => {
      const response = await axios.post("https://234hgv23b3b3bv2.stablediffusionapi.com/text2img", {
        key: "rdrv398457321!@#___",
        prompt: input,
        negative_prompt: negativePrompt,
        width: "512",
        height: "512",
        samples: 1,
        num_inference_steps: 20,
        seed: null,
        guidance_scale: 7.5,
        webhook: null,
        track_id: null,
        model_id: model,
      });
      return response;
    });
    if (response.data.status === "queued") {
      return `http://moon-labs-stable-diffusion.s3.amazonaws.com/generations/${response.data.fileId}-0.png`;
    } else if (response.data.status === "error") {
      console.log(response.data);
      return false;
    } else {
      return `http://moon-labs-stable-diffusion.s3.amazonaws.com/generations/${response.data.images[0]}`;
    }
  } catch (err) {
    console.log(err);
    return false;
  }
};

const generateImage2Image = async (input, model, img) => {
  try {
    const negativePrompt = input.split(":negative ")[1];
    const response = await backOff(async () => {
      const response = await axios.post("https://234hgv23b3b3bv2.stablediffusionapi.com/img2img", {
        key: "rdrv398457321!@#___",
        prompt: input,
        negative_prompt: negativePrompt,
        init_image: img,
        height: "512",
        samples: 1,
        num_inference_steps: 20,
        seed: null,
        guidance_scale: 7.5,
        webhook: null,
        track_id: null,
        model_id: model,
      });
      return response;
    });
    console.log(response);
    if (response.data.status === "queued") {
      const retry = () => {
        setTimeout(async () => {
          try {
            const res = await axios.post(`${response.data.fetch_result}`, { key: "zpON207pthXwqXvGsHfi6flGq1br6I0tfD1Wd8QHfvLAt0jRJFzVglz7yDyk" });
            if (res.data.status === "success") {
              return res.data.images[0];
            }
            retry();
          } catch (err) {
            return [false];
          }
        }, 3000);
      };
      retry();
    } else if (response.data.status === "error") {
      return false;
    } else {
      return `http://moon-labs-stable-diffusion.s3.amazonaws.com/generations/${response.data.images[0]}`;
    }
  } catch (err) {
    console.log(err);
    return false;
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

module.exports = { generateText, generateImage, moderationFilter, generateTextToSpeech, generateImage2Image, generateCode };
