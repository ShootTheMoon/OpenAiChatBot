// Lib imports
const fs = require("fs");

const privateBufferTime = 15;
const groupBufferTime = 15;
const chatExceptions = [-1001848309914, -1001555247769, -1001555247769];

const chatHandler = (chat) => {
  try {
    const type = chat.type;
    if (type === "private") {
      const res = privateHandler(chat.id, chat.username);
      return res;
    } else {
      const res = groupHandler(chat.id, chat.title, type);
      return res;
    }
  } catch (err) {
    console.log(err);
    return true;
  }
};

const chatExceptionsHandler = (id) => {
  const found = chatExceptions.findIndex((chatId) => chatId === id);
  if (found === -1) {
    return false;
  }
  return true;
};

const groupHandler = (id, title, groupType) => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  const found = data.groups.findIndex(({ chatId }) => chatId === id);
  const d = new Date();
  const date = (d.getTime() / 1000).toFixed();
  if (found === -1) {
    data.groups.push({ chatId: id, name: title, type: groupType, request: 1, lastRequest: date });
    fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
    return true;
  }
  return updateGroup(id, found, title);
};
const privateHandler = (id, username) => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  const found = data.private.findIndex(({ chatId }) => chatId === id);
  const d = new Date();
  const date = (d.getTime() / 1000).toFixed();
  if (found === -1) {
    data.private.push({ chatId: id, name: username, request: 1, lastRequest: date });
    fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
    return true;
  }
  return updatePrivate(id, found, username);
};

const updateGroup = (id, found, title) => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  const d = new Date();
  const date = (d.getTime() / 1000).toFixed();
  const lastRequest = data.groups[found].lastRequest;
  if (chatExceptionsHandler(id) === true) {
    data.groups[found].name = title;
    data.groups[found].request += 1;
    data.groups[found].lastRequest = date;
    fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
    return true;
  }
  if ((date - lastRequest).toFixed() < groupBufferTime) {
    return false;
  }
  data.groups[found].name = title;
  data.groups[found].request += 1;
  data.groups[found].lastRequest = date;
  fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
  return true;
};
const updatePrivate = (id, found, username) => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  const d = new Date();
  const date = (d.getTime() / 1000).toFixed();
  const lastRequest = data.private[found].lastRequest;
  if (chatExceptionsHandler(id) === true) {
    data.private[found].name = username;
    data.private[found].request += 1;
    data.private[found].lastRequest = date;
    fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
    return true;
  }
  if ((date - lastRequest).toFixed() < privateBufferTime) {
    return false;
  }
  data.private[found].name = username;
  data.private[found].request += 1;
  data.private[found].lastRequest = date;
  fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
  return true;
};

const getDetailedMetrics = () => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  let text = "";
  let requests = 0;
  let numOfGroups = 0;
  for (let i = 0; i < data.groups.length; i++) {
    requests += data.groups[i].request;
    numOfGroups += 1;
    text += `Name: ${data.groups[i].name} - Requests: ${data.groups[i].request}\n`;
  }
  text += `\nNumber of groups: ${numOfGroups} Total requests: ${requests} \n\n`;
  console.log(text);

  //   for (let i = 0; i < data.private.length; i++) {
  //     requests += data.private[i].request;
  //     numOfPrivate += 1;
  //     text += `Name: ${data.groups[i].name} - Requests: ${data.groups[i].request}\n`;
  //   }
  //   text += `Number of groups: ${numOfGroups} Total requests: ${requests}`;
  return "Check console";
};
const getMetrics = () => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  let text = "";
  let requests = 0;
  let numOfGroups = 0;
  let numOfPrivate = 0;
  for (let i = 0; i < data.groups.length; i++) {
    requests += data.groups[i].request;
    numOfGroups += 1;
  }
  for (let i = 0; i < data.private.length; i++) {
    requests += data.private[i].request;
    numOfPrivate += 1;
  }
  text += `*Number of groups:* ${numOfGroups}\n*Number of private chats:* ${numOfPrivate}\n*Total requests:* ${requests}`;
  return text;
};

module.exports = { getDetailedMetrics, getMetrics, chatHandler };
