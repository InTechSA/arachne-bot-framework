'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConnectorSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: false
  },
  token: {
    type: String,
    default: ""
  },
  ip: {
    type: String,
    default: ""
  }
});

const Connector = mongoose.model('Connector', ConnectorSchema);

module.exports = Connector;
