/*
  SKILL : greetings
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
  'thanks': {
    cmd: 'thanks',
    execute: sayThanks,
    expected_args: [],
  },
  'greets': {
    cmd: 'greets',
    execute: sayHello,
    expected_args: []
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'greetings-say-hello': {
    slug: 'say-hello',
    handle: handleHello,
    expected_entities: []
  },
  'greetings-say-thank': {
    slug: 'say-thanks',
    handle: handleThanks,
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
function sayThanks({ data }) {
  return new Promise((resolve, reject) => {

    return resolve({
      message: {
        text: `Don't say thanks, ${data.user_name || "fellow"}!`
      }
    });
  });
}

function sayHello({ data }) {
  return new Promise((resolve, reject) => {
    return resolve({
      message: {
        text: `Hello${" "+data.user_name || " "}o/`
      }
    });
  });
}

function handleHello({ data }) {
  return sayHello({ data });
}

function handleThanks({ data }) {
  return sayThanks({ data });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.