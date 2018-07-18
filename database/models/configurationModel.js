'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ConfigurationSchema = new Schema({
    confList: {
        type: Object,
        default: {
            botname: {
                name: "Name of bot",
                value: "Arachne",
                type: "botParam",
                description: ""
            },
            lang: {
                name: "Language",
                value: "EN",
                type: "botParam",
                description: ""
            },
            noskillfound: {
                name: "No Skill Found message",
                value: "I can't handle your command because I don't know it. Maybe it was disabled :/ If not, you can teach me by adding new skills!",
                type: "errorMessage",
                description: "Message printed when there was no skill found with the /command route"
            },
            errornlp: {
                name: "Error of nlp message",
                value: "Unkown error with nlp endpoint.",
                type: "errorMessage",
                description: "Message printed when there is an error with the nlp"
            },
            errorintent: {
                name: "Error of intent message",
                value: "Unkown error while handling intent.",
                type: "errorMessage",
                description: "Message printed when there was no intent found"
            },
            noskillfoundnlp: {
                name: "No skill found nlp message",
                value: "I can't handle your intention, yet I think it is *[IntentName]*. Maybe it was disabled :/",
                type: "errorMessage",
                description: "Message printed when there was no skill with the intent retrieved found"
            },
            noentitiesfound: {
                name: "No entities found message",
                value: "I understand the intent is [IntentName], but I'm missing some entities. I expect : [Entities].",
                type: "errorMessage",
                description: "Message printed when there was no entities found in the given message"
            },
            errorcommand: {
                name: "Error with command message",
                value: "Unkown error while handling command.",
                type: "errorMessage",
                description: "Message printed when there is an error in the command execution"
            },
            errorthread: {
                name: "Error with thread message",
                value: "Unkown error while handling conversation in thread.",
                type: "errorMessage",
                description: "Message printed when there is an error in the thread execution"
            },
            unauthorized: {
                name: "Unauthorized error",
                value: "You are not allowed to use that",
                type: "errorMessage",
                description: "Message printed when the user try to to a command or an intent he is not authorized to"
            }
        }
    }
});

const Configuration = mongoose.model('Configuration', ConfigurationSchema);

module.exports = Configuration;
