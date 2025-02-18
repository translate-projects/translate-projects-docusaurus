export default [
  {
    ignores: ['node_modules', 'dist'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      prettier: require('eslint-plugin-prettier'),
    },
    rules: {
      ...require('eslint-config-prettier').rules,
      'prettier/prettier': 'error',
    },
  },
];
