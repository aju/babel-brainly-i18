const generator = require('babel-generator');
const t = require('babel-types');
const Translator = require('./translator');
let translator;

function isValidBinaryExpressionSide(side) {
  return t.isBinaryExpression(side) ? isValidBinaryExpression(side) : t.isStringLiteral(side);
}

function isValidBinaryExpression(element) {
  element = element.node || element;

  if (!t.isBinaryExpression(element) || element.operator !== '+') {
    return false;
  }
  return isValidBinaryExpressionSide(element.left) && isValidBinaryExpressionSide(element.right);
}

function getBinaryExpressionValue(element) {
  element = element.node || element;

  if (t.isStringLiteral(element)) {
    return element.value || '';
  }
  return getBinaryExpressionValue(element.left) + getBinaryExpressionValue(element.right);
}

function replaceInTranslation(translation, what, newValue) {
  return translation.reduce((result, trans) => {
    if (typeof trans !== 'string') {
      return result.concat(trans);
    }
    return result.concat(trans.split(`%${what}%`)
      .reduce((result, el, index, values) =>
        result.concat(index < values.length - 1 ? [el, newValue] : [el]), []));
  }, []);
}

function getErrorMessage(ast) {
  return `Translator call not supported: "${generator.default(ast).code}"`;
}

function handleError(node, strict) {
  if (strict) {
    throw new Error(getErrorMessage(node));
  } else {
    console.warn(getErrorMessage(node));
  }
}

module.exports = function() {
  return {
    visitor: {
      CallExpression(path, state) {
        if (!translator) {
          translator = new Translator(state.opts.translations);
        }
        const callee = path.get('callee').node;

        // Check if call expresion on translator
        if (t.isMemberExpression(callee) && callee.object.name === 'translator') {

          if (callee.property.name !== 'trans') {
            handleError(path.node, state.opts.strict);
            return;
          }

          // Handle when 1 translator.trans has 1 parameter
          if (path.get('arguments').length === 1) {
            let translationKey;
            const transParam = path.get('arguments')[0];

            if (t.isStringLiteral(transParam)) {
              translationKey = transParam.node.value;
            } else if (isValidBinaryExpression(transParam)) {
              translationKey = getBinaryExpressionValue(transParam);
            } else {
              handleError(path.node, state.opts.strict);
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

            optionsParam.node.properties.forEach(prop => {
              const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;

              options.push({key, value: prop.value});
            });

            let transArray = [translation];

            options.forEach(opt => {
              transArray = replaceInTranslation(transArray, opt.key, opt.value);
            });
            transArray = transArray.map(el => {
              if (typeof el === 'string') {
                return t.stringLiteral(el);
              }
              return el;
            });
            transArray = transArray.reduceRight((result, element) => {
              if (!result) {
                return element;
              }
              return t.binaryExpression('+', element, result);
            }, null);

            if (isValidBinaryExpression(transArray)) {
              path.replaceWith(t.stringLiteral(getBinaryExpressionValue(transArray)));
            } else {
              path.replaceWith(transArray);
            }
          }
        }
      }
    }
  };
};
