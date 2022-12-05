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

module.exports = { addNewGroup, addNewPrivate };
