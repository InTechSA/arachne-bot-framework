/*
  SKILL : weather
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
  weather : {
    cmd: 'weather',
    execute: getWeather,
    expected_args: ['location']
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'weather-weather': {
    slug: 'weather',
    handle: handleWeather,
    expected_entities: ['location']
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
let dependencies = ['request'];
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
const request = require('request');

const serviceURL = "http://localhost:5012";

function getWeather({ phrase }) {
  return new Promise((resolve, reject) => {
    let location = phrase;
    if (location.length <= 0) {
      return resolve({
        message :{
          text: `I need a location (like \`Kayl, lu\`).`
        }
      });
    }

    console.log(`> [INFO] {weather} - Get weather for "${location}".`);
    request({
      baseUrl: serviceURL,
      uri: '/weather',
      qs: {
        location: location
      },
      json: true,
      callback: (err, res, body) => {
        if (!err && body && body.success) {
          let weatherMessage = `Here's the weather for *${body.weather.name}*:`
          weatherMessage += `\nSky: ${body.weather.weather[0].main}`;
          resolve({
            message :{
              text: weatherMessage
            }
          });
        } else {
          resolve({
            message: {
              text: "I couldn't load weather for this location :/"
            }
          });
        }
      }
    });
  });
}

function handleWeather({ entities: {location: location = ""} }) {
  let finalLocation = location[0];
  return getWeather({ phrase: finalLocation });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.