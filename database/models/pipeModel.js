'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PipeSchema = new Schema({
  skill: {
      type: String,
      required: true
  },
  identifier: {
      type: String,
      required: true
  },
  handler: {
      type: String,
      required: true
  },
  secret: {
      type: String
  }
});

const Pipe = mongoose.model('Pipe', PipeSchema);

module.exports = Pipe;
