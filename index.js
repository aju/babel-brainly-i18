const getTranslation = require('./utils');

module.exports = function(babel) {
  const  t = babel.types;

  return {
    visitor: {
      CallExpression(path) {
        const callee = path.get('callee').node;

        // Check if call expresion is translator.trans
        if(t.isMemberExpression(callee) &&
          callee.object.name === 'translator' &&
          callee.property.name === 'trans'
        ) {

          // Handle when 1 parameter that is string literal
          if(path.get('arguments').length === 1 &&
            t.isStringLiteral(path.get('arguments')[0])
          ) {
            const translation = getTranslation(path.get('arguments')[0].node.value);

            path.replaceWith(t.stringLiteral(translation));
          }
        }
      }
    }
  };
};
