'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StorageSchema = new Schema({
  skill: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

const Storage = mongoose.model('Storage', StorageSchema);

module.exports = Storage;
