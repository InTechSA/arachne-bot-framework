'use strict';
const mongoose = require('mongoose');
const config = { host: (process.env.MONGO_URL || "mongodb://localhost:27017/arachne") };

let connected = false;

exports.connect = function() {
  if (!connected) {
    console.log("> [INFO] \x1b[36mConnecting to mongodb database...\x1b[0m");
    return mongoose.connect(config.host).then(() => {
      console.log("> [INFO] \x1b[42mConnected to mongodb database!\x1b[0m")
      return connected = true;
    }).catch((err) => {
      console.log(err);
      console.log("> [ERROR] Could not connect to mongodb database!")
    });
  }
  console.log("> [WARNING] Already connected to mongod database.")
  return connected = true;
};
