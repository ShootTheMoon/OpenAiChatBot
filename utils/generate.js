const { Configuration, OpenAIApi } = require("openai");
const { backOff } = require("exponential-backoff");
const textToSpeech = require("@google-cloud/text-to-speech");
const fs = require("fs");
const util = require("util");
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");

const { OPENAI_KEY } = process.env;
const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);
const client = new textToSpeech.TextToSpeechClient();

const generateText = async (input) => {
  try {
    const filter = false;
    if (filter === false) {
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
    } else {
      return ["_Given text violates OpenAI's Content Policy_"];
    }
  } catch (err) {
    console.log(err);
    return [false];
  }
};

// const generateImage = async (input) => {
//   try {
//     const filter = false;
//     if (filter === false) {
//       const response = await backOff(async () => {
//         const response = await axios.post("https://stablediffusionapi.com/api/v3/dreambooth", {
//           key: "zpON207pthXwqXvGsHfi6flGq1br6I0tfD1Wd8QHfvLAt0jRJFzVglz7yDyk",
//           prompt: input,
//           negative_prompt: "",
//           width: "512",
//           height: "512",
//           samples: 1,
//           num_inference_steps: "20",
//           seed: null,
//           guidance_scale: 7.5,
//           webhook: null,
//           track_id: null,
//         });
//         return response;
//       });
//       console.log(response.data);
//       return [response.data.output[0]];
//     } else {
//       return ["_Given text violates OpenAI's Content Policy_"];
//     }
//   } catch (err) {
//     console.log(err);
//     return [false];
//   }
// };

const generateImage = async (input) => {
  try {
    const filter = false;
    if (filter === false) {
      console.log(input);
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
    console.log(err);
    return false;
  }
};

module.exports = { generateText, generateImage, moderationFilter, generateTextToSpeech };
