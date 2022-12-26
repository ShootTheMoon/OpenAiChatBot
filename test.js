const axios = require("axios");

axios.get("http://moon-labs-stable-diffusion.s3.amazonaws.com/generations/9aebfd84-85db-4af2-b81d-49c1eebcd419-0.png").then((data) => console.log(data));
