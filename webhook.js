const express = require("express");
const axios = require("axios");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.post("*", (req, res) => {
  if (req.body.status == "success") {
    axios.post("http://localhost:4200/webhook/", { id: req.body.meta.file_prefix, imgUrl: req.body.output });
  }
});

app.listen(1337, () => {
  console.log("Listening on port " + 1337);
});
