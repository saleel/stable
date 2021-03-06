module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: ["airbnb-base", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 12,
  },
  overrides: [
    {
      files: ["hardhat.config.js"],
      globals: { task: true },
    },
    {
      files: ["scripts/**"],
      rules: { "no-process-exit": "off" },
    },
    {
      files: ["hardhat.config.js", "scripts/**", "test/**"],
      rules: { "node/no-unpublished-require": "off" },
    },
  ],
};
