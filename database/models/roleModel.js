'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
  name: {
      type: String,
      required: true
  },
  permissions: {
      type: [String],
      default: []
  },
  default: {
      type: Boolean,
      default: false
  }
});

const Role = mongoose.model('Role', RoleSchema);

module.exports = Role;
