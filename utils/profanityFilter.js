const profanity = ["nigger", "nigga", "fag", "faggot", "kike", "slut", "fagot", "cock", "penis", "tits", "tit", "fuck", "fucker", "fucked", "porn", "whore", "bitch", "anal", "blowjob", "rape", "pussy"];

const profanityFilter = (msg) => {
  for (let i = 0; i < profanity.length; i++) {
    console.log(msg);
    let regex = new RegExp("\\b(" + profanity[i] + ")\\b");
    if ((msg.match(regex) == null) == false) {
      console.log(msg.match(regex) == null);
      return true;
    }
  }
  return false;
};

module.exports = { profanityFilter };
