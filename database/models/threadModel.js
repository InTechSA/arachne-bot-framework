'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ThreadSchema = new Schema({
  timestamp: {
    type: Date,
    default: new Date()
  },
  source: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    default: []
  },
  handler: {
    type: String,
    required: true
  }
});

ThreadSchema.methods.getData = function(dataKey) {
  let found = this.data.filter((data) => data[0] === dataKey);
  if (found.length <= 0) {
    return null;
  }

  return found[0][1];
};

ThreadSchema.methods.setData = function(dataKey, dataValue) {
  let tdata = this.data.filter((data) => data[0] !== dataKey);
  tdata.push([dataKey, dataValue]);
  this.data = tdata;
  
  return;
};

const Thread = mongoose.model('Thread', ThreadSchema);

module.exports = Thread;
