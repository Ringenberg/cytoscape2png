module.exports = {
  "env": {
    "es6": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaVersion": 2021
  },
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
};
