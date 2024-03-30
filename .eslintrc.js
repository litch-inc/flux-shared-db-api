module.exports = {
  root: true,
  env: {
    commonjs: true,
    node: true,
    mocha: true
  },
  extends: [
    'airbnb-base'
  ],
  rules: {
    'max-len': [
      'error',
      {
        code: 300,
        ignoreUrls: true,
        ignoreTrailingComments: true
      }
    ],
    'no-console': 'off',
    'default-param-last': 'off',
    'import/extensions': ['error', 'never'],
    'linebreak-style': [
      'error',
      process.platform === 'win32' ? 'windows' : 'unix'
    ],
    'comma-dangle': ['error', 'never'],
    'no-else-return': 'off',
    'prefer-destructuring': 'off',
    strict: ['error', 'global'],
    'function-paren-newline': ['error', 'never'],
    'no-tabs': ["error", { allowIndentationTabs: true }],
    'indent': 'off',
    'no-underscore-dangle': 'off',
    'lines-between-class-members': 'off',
    'no-plusplus': 'off',
    'no-mixed-spaces-and-tabs': 'off'
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 8,
    requireConfigFile: false,
    sourceType: 'script',
    ecmaFeatures: {
      experimentalObjectRestSpread: true
    }
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)'
      ],
      env: {
        mocha: true
      }
    }
  ]
};
