// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    settings: {
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
        },
        typescript: {
          alwaysTryTypes: true, // always try to resolve types under the same name
          project: './tsconfig.json'
        }
      }
    },
    rules: {
      'import/no-unresolved': ['error', { ignore: ['\\.(json)$'] }]
    }
  },
]);
