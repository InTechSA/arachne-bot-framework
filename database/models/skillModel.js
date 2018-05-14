'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SkillSchema = new Schema({
  name: {
      type: String,
      required: true
  },
  author: String,
  creation: {
      type: Date,
      default: new Date()
  },
  last_update: {
      type: Date,
      default: new Date()
  },
  code: String,
  secret: {
      type: Map,
      of: String,
      default: new Map()
  }
});

const Skill = mongoose.model('Skill', SkillSchema);

module.exports = Skill;
