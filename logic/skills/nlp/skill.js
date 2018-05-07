/*
  SKILL : nlp
  AUTHOR : System
  DATE : 17/04/2018
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
const recastai = require('recastai');
const secret = require('./secret');

const client = new recastai.request(secret.recastai_token, 'en');

function analyzeText({ phrase = "" }) {
  return new Promise((resolve, reject) => {
    if (!client) {
      return reject();
    }
    console.log(`> [INFO] {nlp} - Analyze "${phrase}".`);
    client.analyseText(phrase).then((res) => {
      let analyzed = { };
      analyzed.intent = res.intent() ? res.intent().slug : null;
      analyzed.entities = {};
      for (let entityName in res.entities) {
        analyzed.entities[entityName] = []
        for (let entity of res.entities[entityName]) {
          analyzed.entities[entityName].push(entity.raw);
        }
      }

      analyzed.message = {
        text: res.intent() ? `I think your intent is *${res.intent().slug}*.` : `I did'nt found any intent in this sentence.`
      };

      return resolve(analyzed);
    }).catch((err) => {
      return reject(err);
    });
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.