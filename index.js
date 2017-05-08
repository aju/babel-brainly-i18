const t = require('babel-types');
const Translator = require('./translator');
let translator;

function getBinaryExpressionValue(element) {
  if (t.isStringLiteral(element)) {
    return element;
  }
  return getBinaryExpressionValue(element.node.left).value + getBinaryExpressionValue(element.node.right).value;
}

function replaceInTranslation(translation, what, newValue) {
  return translation.reduce((result, trans) => {
    if(typeof trans !== 'string') {
      return result.concat(trans);
    }
    return result.concat(trans.split(`%${what}%`)
      .reduce((result, el, index, values) => {
        return result.concat(index < values.length - 1 ? [el, newValue] : [el])
      }, []));
  }, []);
}

module.exports = function() {
  return {
    visitor: {
      CallExpression(path, state) {
        if(!translator) {
          translator = new Translator(state.opts.translations);
        }
        const callee = path.get('callee').node;

        // Check if call expresion is translator.trans
        if(t.isMemberExpression(callee) &&
          callee.object.name === 'translator' &&
          callee.property.name === 'trans'
        ) {

          // Handle when 1 translator.trans has 1 parameter
          if(path.get('arguments').length === 1) {
            let translationKey;
            const transParam = path.get('arguments')[0];

            if(t.isStringLiteral(transParam)) {
              translationKey = transParam.node.value;
            } else if(t.isBinaryExpression(transParam)) {
              //TODO Validate binary expression
              translationKey = getBinaryExpressionValue(transParam);
            } else {
              return;
            }
            const translation = translator.getTranslation(translationKey);

            path.replaceWith(t.stringLiteral(translation));
          } else {
            const transParam = path.get('arguments')[0];
            const optionsParam = path.get('arguments')[1];
            const translationKey = transParam.node.value;
            const translation = translator.getTranslation(translationKey);
            const options = [];

            optionsParam.node.properties.forEach((prop, index) => {
              options.push({key: prop.key.value, value: prop.value});
            });

            let transArray = [translation];
            options.forEach(opt => {
              transArray = replaceInTranslation(transArray, opt.key, opt.value);
            });
            transArray = transArray.map(el => typeof el === 'string' ? t.stringLiteral(el) : el);
            transArray = transArray.reduceRight((result, element) => {
              if(!result) {
                return element;
              }
              return t.binaryExpression('+', element, result);
            }, null);
            path.replaceWith(transArray);
          }
        }
      }
    }
  };
};
