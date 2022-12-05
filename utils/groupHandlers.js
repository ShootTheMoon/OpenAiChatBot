// Lib imports
const fs = require("fs");

const addNewGroup = (id, title, groupType) => {
  let data = fs.readFileSync("./groupData.json", "utf-8");
  data = JSON.parse(data);
  const found = data.groups.findIndex(({ chatId }) => chatId === id);
  if (found === -1) {
    data.groups.push({ chatId: id, name: title, type: groupType, request: 1 });
    fs.writeFileSync("./groupData.json", JSON.stringify(data));
    return true;
  }
  updateGroup(found, title);
};
const addNewPrivate = (id, username) => {
  let data = fs.readFileSync("./groupData.json", "utf-8");
  data = JSON.parse(data);
  const found = data.private.findIndex(({ chatId }) => chatId === id);
  if (found === -1) {
    data.private.push({ chatId: id, name: username, request: 1 });
    fs.writeFileSync("./groupData.json", JSON.stringify(data));
    return true;
  }
  updatePrivate(found, username);
};

const updateGroup = (found, title) => {
  let data = fs.readFileSync("./groupData.json", "utf-8");
  data = JSON.parse(data);
  data.groups[found].name = title;
  data.groups[found].request += 1;
  fs.writeFileSync("./groupData.json", JSON.stringify(data));
};
const updatePrivate = (found, username) => {
  let data = fs.readFileSync("./groupData.json", "utf-8");
  data = JSON.parse(data);
  data.private[found].name = username;
  data.private[found].request += 1;
  fs.writeFileSync("./groupData.json", JSON.stringify(data));
};

const getMetrics = () => {
  let data = fs.readFileSync("./groupData.json", "utf-8");
  data = JSON.parse(data);
  let text = "";
  let requests = 0;
  let numOfGroups = 0;
  for (let i = 0; i < data.groups.length; i++) {
    requests += data.groups[i].request;
    numOfGroups += 1;
    text += `*Name:* ${data.groups[i].name} - *Requests:* ${data.groups[i].request}\n`;
  }
  text += `\n*Number of groups:* ${numOfGroups} *Total requests:* ${requests} \n\n`;

  //   for (let i = 0; i < data.private.length; i++) {
  //     requests += data.private[i].request;
  //     numOfPrivate += 1;
  //     text += `Name: ${data.groups[i].name} - Requests: ${data.groups[i].request}\n`;
  //   }
  //   text += `Number of groups: ${numOfGroups} Total requests: ${requests}`;
  return text;
};

module.exports = { getMetrics, addNewGroup, addNewPrivate };
