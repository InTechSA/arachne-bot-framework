module.exports = {
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": 6
    },
    "env" : {
        "node" : true,
        "jquery" : true,
        "es6": true
    },
    "rules": {
        "no-console": "off", // TODO: Use logger,
        "no-unused-vars": "warn"
    }
};