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
  active: {
    type: Boolean,
    default: false
  },
  code: String,
  code_id: {
    type: String,
    default: (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).toUpperCase()
  },
  secret: {
      type: Map,
      of: String,
      default: new Map()
  }
});

const Skill = mongoose.model('Skill', SkillSchema);

module.exports = Skill;
