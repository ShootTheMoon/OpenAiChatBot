// Lib imports
const fs = require("fs");

const privateBufferTime = 30;
const groupBufferTime = 10;
const chatExceptions = [-1001848309914, -1001555247769, -1001555247769, -1001846307911, 2056782424];

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

// Check if whitelisted
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
    return [false, 0];
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
    return [false, 0];
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
    return [false, 0];
  }
  if ((date - lastRequest).toFixed() < groupBufferTime) {
    return ["group", (groupBufferTime - (date - lastRequest)).toFixed()];
  }
  data.groups[found].name = title;
  data.groups[found].request += 1;
  data.groups[found].lastRequest = date;
  fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
  return [false, 0];
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
    return [false, 0];
  }
  if ((date - lastRequest).toFixed() < privateBufferTime) {
    return ["private", (privateBufferTime - (date - lastRequest)).toFixed()];
  }
  data.private[found].name = username;
  data.private[found].request += 1;
  data.private[found].lastRequest = date;
  fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
  return [false, 0];
};

const sortData = () => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  function insertionSort(inputArr) {
    let n = inputArr.groups.length;
    for (let i = 1; i < n; i++) {
      // Choosing the first element in our unsorted subarray
      let current = inputArr.groups[i];
      // The last element of our sorted subarray
      let j = i - 1;
      while (j > -1 && current.request > inputArr.groups[j].request) {
        inputArr.groups[j + 1] = inputArr.groups[j];
        j--;
      }
      inputArr.groups[j + 1] = current;
    }
    n = inputArr.private.length;
    for (let i = 1; i < n; i++) {
      // Choosing the first element in our unsorted subarray
      let current = inputArr.private[i];
      // The last element of our sorted subarray
      let j = i - 1;
      while (j > -1 && current.request > inputArr.private[j].request) {
        inputArr.private[j + 1] = inputArr.private[j];
        j--;
      }
      inputArr.private[j + 1] = current;
    }
    return inputArr;
  }

  data = insertionSort(data);
  fs.writeFileSync("./data/groupData.json", JSON.stringify(data));
};

const getMetrics = (id) => {
  let data = fs.readFileSync("./data/groupData.json", "utf-8");
  data = JSON.parse(data);
  let text = "";
  let request = 0;
  let numOfGroups = 0;
  let numOfPrivate = 0;
  for (let i = 0; i < data.groups.length; i++) {
    request += data.groups[i].request;
    numOfGroups += 1;
  }
  for (let i = 0; i < data.private.length; i++) {
    request += data.private[i].request;
    numOfPrivate += 1;
  }

  const group = data.groups.findIndex(({ chatId }) => chatId === id);
  if (group != -1) {
    const req = data.groups[group].request;
    text += `*Number of groups:* ${numOfGroups}\n*Number of private chats:* ${numOfPrivate}\n*Total request:* ${request}\n*Request sent in this group*: ${req}`;
    return text;
  }
  const private = data.private.findIndex(({ chatId }) => chatId === id);
  if (private != -1) {
    const req = data.private[private].request;
    text += `*Number of groups:* ${numOfGroups}\n*Number of private chats:* ${numOfPrivate}\n*Total request:* ${request}\n*Request sent in this chat*: ${req}`;
    return text;
  }
  text += `*Number of groups:* ${numOfGroups}\n*Number of private chats:* ${numOfPrivate}\n*Total request:* ${request}`;
  return text;
};

module.exports = { sortData, getMetrics, chatHandler };
