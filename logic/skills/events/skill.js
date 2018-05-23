/*
  SKILL : events
  AUTHOR : Anonymous
  DATE : 30/04/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'events': {
    cmd: "events",
    execute: eventsHandler
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'events-events': {
    slug: "ask-soon-events",
    handle: nlpEvents,
    expected_entities: []
  }
};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
const overseer = require('../../overseer');
let dependencies = ["request"];
/* </SKILL DEPENDENCIES> */

// Exposing the skill definition.
exports.commands = commands;
exports.intents = intents;
exports.dependencies = dependencies;
exports.interactions = interactions;

/*
  Skill logic begins here.
  You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
*/
/* <SKILL LOGIC> */
var request = require('request');
var url_event_micro = "http://192.168.6.53:8003";
/**
  Handler for command events (!events).

  Params :
  --------
    phrase: String
*/
/**
 * @param {phrase (String), data (Object)} param0 the phrase entered by the user , and the datas sent by the adapter
 */
function eventsHandler({ phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    // Retrieve the parameter that the user sent with the !events command
    var message = {};
    var query = phrase.trim().replace('events', '').trim();
    // if there is no query, associate it to soon
    if (query === '') {
      query = 'soon';
    }
    console.log("Retreiving token ... ");
    // retrieve the ad token 
    overseer.handleCommand('get-ad-token').then((response) => {
      console.log("Retrieve Token");
      // Build the request
      let options = {
        url: url_event_micro + '/getEvents/' + query,
        headers: {
          'Authorization': response,
          'Accept': 'application/json'
        }
      }
      // Make the request using request
      request(options, (err, res, body) => {
        if (err || res.statusCode !== 200) {
          // Error
          if(!body) {
              message = { text: "Une erreur est survenue lors de l'appel du microservice events :( " };
          }
          message = JSON.parse(body);
        } else {
          // No error
          message = JSON.parse(body);
        }
        return resolve({
          message: message
        });
      });
    }).catch((error) => {
      console.log("Catch error in command get-ad-token " + error);
      /* Handle the error of this command here */
      message.text = "Could not retrieved the token from the ad :(";
      message.private = true;
      return resolve({
        success: false,
        message: message
      });
    });
  });
}
/**
  Handler for intent events-events (ask-soon-events).

  Params :
  --------
    entities (Object)
*/
function nlpEvents({ entities = {}, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    eventsHandler({phrase: "events soon"}).then((message) => {
        return resolve(message);
    }).catch((message) => {
        return reject(message);
    });
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.