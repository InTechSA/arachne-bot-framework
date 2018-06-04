'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema({
  nameSkill: {
      type: String,
      required: true
  },
  log: String
});

const Log = mongoose.model('Log', LogSchema);

module.exports = Log;
