module.exports = class Translator {
  constructor(filesList) {
    const translations = filesList.map(file => require(file));

    this.sourceStrings = translations.reduce((strings, trans) => {
      const locale = Object.keys(trans.translations)[0];
      const domain = Object.keys(trans.translations[locale])[0];
      const messages = trans.translations[locale][domain];

      return Object.assign(strings, messages);
    }, {});
  }

  getTranslation(key) {
    const translation = this.sourceStrings[key];

    return translation ? translation : key;
  }
};
