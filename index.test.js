/* */
const fs = require('fs');
const path = require('path');
const babel = require('babel-core');
const plugin = require('./index');

const validFixturesDir = path.join(__dirname, 'fixtures/valid');
const invalidFixturesDir = path.join(__dirname, 'fixtures/invalid');

getDirectories(validFixturesDir).forEach(directory => {
  const input = fs.readFileSync(path.join(validFixturesDir, directory, 'input.js'), 'utf8').trim();
  const expectedOutput = fs.readFileSync(path.join(validFixturesDir, directory, 'expected.js'), 'utf8').trim();

  test(directoryNameToTestCase(directory), () => {
    expect(transformCode(input)).toBe(expectedOutput);
  });
});

getDirectories(invalidFixturesDir).forEach(directory => {
  const input = fs.readFileSync(path.join(invalidFixturesDir, directory, 'input.js'), 'utf8').trim();
  const expectedOutput = fs.readFileSync(path.join(invalidFixturesDir, directory, 'expected.js'), 'utf8').trim();

  beforeEach(() => {
    console.warn = jest.genMockFunction();
  });

  test(directoryNameToTestCase(directory), () => {
    expect(transformCode(input)).toBe(expectedOutput);
    expect(console.warn).toBeCalled();
  });

  afterEach(() => {
    console.warn.mockClear();
  });
});

getDirectories(invalidFixturesDir).forEach(directory => {
  const input = fs.readFileSync(path.join(invalidFixturesDir, directory, 'input.js'), 'utf8').trim();

  test(`Strict mode: ${directoryNameToTestCase(directory)}`, () => {
    expect(transformCode.bind(null, input, true)).toThrow();
  });
});

function directoryNameToTestCase(name) {
  return capitalizeFirstChar(name.split('-').join(' '));
}

function capitalizeFirstChar(str) {
  return str.charAt(0).toUpperCase() + str.substring(1);
}

function getDirectories(srcPath) {
  return fs.readdirSync(srcPath)
    .filter(file => fs.statSync(path.join(srcPath, file)).isDirectory());
}

function transformCode(input, strict = false) {
  const output = babel.transform(input, {
    plugins: [
      [plugin, {
        translations: [
          path.join(__dirname, 'translations/messages.json'),
          path.join(__dirname, 'translations/messages-js.json')],
        strict
      }]
    ]
  });

  return output.code;
}
