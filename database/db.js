'use strict';
const mongoose = require('mongoose');
const config = { host: (process.env.MONGO_URL || "mongodb://localhost:27017/arachne") };
const logger = new (require('./../logic/components/Logger'))();

let connected = false;

exports.connect = function() {
  if (!connected) {
    logger.info("\x1b[36mConnecting to mongodb database...\x1b[0m");
    return mongoose.connect(config.host).then(() => {
      logger.info("\x1b[42mConnected to mongodb database!\x1b[0m")
      return connected = true;
    }).catch((err) => {
      logger.error(err);
      logger.error("Could not connect to mongodb database!")
    });
  }
  logger.warn("Already connected to mongod database.");
  return connected = true;
};
