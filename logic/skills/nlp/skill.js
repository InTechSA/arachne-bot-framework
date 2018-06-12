/*
  SKILL : nlp
  AUTHOR : System
  DATE : 14/05/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  analyze : {
    cmd: 'analyze',
    execute: analyzeText,
    expected_args: ['phrase']
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ['recastai'];
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
const secret = require('./secret');
const request = require('request');
const overseer = require('../../overseer');

function analyzeText({ phrase = "" }) {
  return new Promise((resolve, reject) => {
    overseer.log('nlp', `> [INFO] {nlp} - Analyze "${phrase}".`);
    request({
        url: "https://nlu-api.intech-lab.com/nlp/parse/"+secret.nlu_id,
        method: "POST",
        headers: { 'App-Token': secret.nlu_token },
        body: {
            "text": phrase
        },
        json: true
    }, (err,res,body) => {
        if(err) {
            overseer.log("nlp", '> [ERROR] Error contacting the nlu API '+err);
            return resolve({message : {text: 'Error contacting the nlu API '+err}});
        }
        let analyzed = { };
        try {
            analyzed.intent = body.data.intent ? body.data.intent.name.toLowerCase() : null;
          analyzed.entities = {};
          if(body.data.entities) {
              for (let entity of body.data.entities) {
                analyzed.entities[entity.entity.toLowerCase()] = analyzed.entities[entity.entity.toLowerCase()] || [];
                analyzed.entities[entity.entity.toLowerCase()].push(entity.value);
              }
          }
    
          analyzed.message = {
            text: analyzed.intent ? `I think your intent is *${analyzed.intent}*.` : `I did'nt found any intent in this sentence.`
          };
    
          return resolve(analyzed);
        } catch(e) {
            return reject(e);
        }
    });
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.