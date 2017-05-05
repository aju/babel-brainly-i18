const messages = require('./translations/messages.json');
const messagesJS = require('./translations/messages-js.json');

const translations = [messages, messagesJS];

const sourceStrings = translations.reduce((strings, trans) => {
  const locale = Object.keys(trans.translations)[0];
  const domain = Object.keys(trans.translations[locale])[0];
  const messages = trans.translations[locale][domain];

  return Object.assign(strings, messages);
}, {});

module.exports = function getTranslation(key) {
  const translation = sourceStrings[key];

  return translation ? translation : key;
};
