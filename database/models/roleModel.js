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
  }
});

const Role = mongoose.model('Role', RoleSchema);

module.exports = Role;
