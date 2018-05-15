/*
  SKILL : convtest
  AUTHOR : Anonymous
  DATE : 15/05/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'convtest': {
    cmd: "convtest",
    execute: handlerconvtest
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
    'thread-test': {
    name: "thread-test",
    interact: testThreadHandler
  }
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = [];
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
const overseer = require('../../overseer');

/**
  Handler for command convtest (!convtest).

  Params :
  --------
    phrase: String
*/
function handlerconvtest({ phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    overseer.ThreadManager.addThread({
        timestamp: new Date(),
        source: phrase,
        data: [],
        handler: "thread-test",
        duration: 20,
        timeout_message: "Cette conversation a timeout, dommage !!"
    }).then((thread) => {
        return resolve({
          message: {
            interactive: true,
            thread_id: thread._id,
            title: "Not implemented",
            text: "J'ai crée le thread"
          }
        });
    });
  });
}

function testThreadHandler(thread, {phrase, data}) {
    return new Promise((resolve, reject) => {
        if(phrase == 'coucou') {
            overseer.ThreadManager.closeThread(thread._id).then(() => {
                return resolve({
                    message: {
                        title: "Aborting",
                        text: `Fermeture`
                    }
                });
            });
        } else {
            return resolve({
                message: {
                    interactive: true,
                    thread_id: thread._id,
                    title: "Continue",
                    text: `Je continue`
                }
            });
        }
    });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.