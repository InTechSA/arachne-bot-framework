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
  created: {
      type: Date,
      default: new Date()
  },
  last_use: {
    type: Date,
    default: new Date()
  },
  secret: {
      type: String
  },
  hookID: {
      type: Schema.Types.ObjectId
  }
});

const Pipe = mongoose.model('Pipe', PipeSchema);

module.exports = Pipe;
