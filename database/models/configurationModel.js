'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConfigurationSchema = new Schema({
  botname: {
      type: String,
      default: "Arachne"
  },
  lang: {
      type: String,
      enum: ["FR", "EN"],
      default: "EN"
  }
});

const Configuration = mongoose.model('Configuration', ConfigurationSchema);

module.exports = Configuration;
