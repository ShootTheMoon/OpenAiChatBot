const profanity = ["nigger", "nigga", "fag", "faggot", "kike", "slut", "fagot", "cock", "penis", "tits", "tit", "fuck", "fucker", "fucked", "porn", "whore", "bitch", "anal", "blowjob", "rape", "pussy"];

const profanityFilter = (msg) => {
  for (let i = 0; i < profanity.length; i++) {
    if (msg.search(profanity[i]) != -1) {
      return true;
    }
  }
  return false;
};

module.exports = { profanityFilter };
