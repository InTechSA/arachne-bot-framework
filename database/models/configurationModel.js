'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConfigurationSchema = new Schema({
  botname: {
      type: String,
      default: "Arachne"
  },
  lang: {
      type: String,
      enum: ["FR", "EN"],
      default: "EN"
  },
  noskillfound: {
      type: String,
      default: "I can't handle your command because I don't know it. Maybe it was disabled :/ If not, you can teach me by adding new skills!"
  },
  errornlp: {
      type:String,
      default: "Unkown error with nlp endpoint."
  },
  errorintent: {
      type: String,
      default: "Unkown error while handling intent."
  },
  noskillfoundnlp: {
      type: String,
      default: "I can't handle your intention, yet I think it is *[IntentName]*. Maybe it was disabled :/"
  },
  noentitiesfound: {
      type: String,
      default: "I understand the intent is [IntentName], but I'm missing some entities. I expect : [Entities]."
  },
  errorcommand: {
      type: String,
      default: "Unkown error while handling command."
  },
  errorthread: {
      type: String,
      default: "Unkown error while handling conversation in thread."
  },
  unauthorized: {
      type: String,
      default: "You are not allowed to use that"
  }
});

const Configuration = mongoose.model('Configuration', ConfigurationSchema);

module.exports = Configuration;
