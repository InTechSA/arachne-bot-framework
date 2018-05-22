'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  user_name: {
    type: String,
    required: true
  },
  registered_date: {
    type: Date,
    default: new Date()
  },
  password: {
    type: String
  },
  last_connect: {
    type: Date,
    default: new Date()
  },
  token: {
    value: String,
    expire_date: Date
  },
  roles: {
    type: [String],
    default: []
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
