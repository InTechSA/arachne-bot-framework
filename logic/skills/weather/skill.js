/*
  SKILL : weather
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
  weather: {
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
const token = require('./secret').token;
const weatherApi = `http://api.openweathermap.org/data/2.5/weather?APPID=${token}&lang=fr&units=metric`;
const weatherIcon = 'http://openweathermap.org/img/w/';
const overseer = require('../../overseer');

function getWeather({ phrase }) {
  return new Promise((resolve, reject) => {
    // Build the request
    let location = phrase.trim().replace("weather", "").trim();
    if (location === '') {
      location = 'Kayl,lu';
    }
    let query = "&q=" + location;
    // Make the query
    request({
      encoding: null,
      uri: weatherApi + query,
      method: 'GET'
    }, (err, res) => {
      if (err || res.statusCode !== 200) {
        return resolve({ message: { text: "Error contacting the weather API :(" } });
      }
      try {
        res = JSON.parse(res.body);   
      } catch (e) {
          overseer.log("weather", e);
          return resolve({
             message: {
                 title: "Could not load weather.",
                 text: "Weather service responded with an error."
             } 
          });
      }
      // No error
      let imageUrl;
      let description = '*' + res.main.temp + '° - ';
      // If the respons contain the weather property , print it
      if (res.weather) {
        imageUrl = weatherIcon + res.weather[0].icon + '.png';
        description += res.weather[0].description + '*\n';
      }
      // Then print the weather
      description += '>Température min : _' + res.main.temp_min + '°_\n'; // jshint ignore:line
      description += '>Température max : _' + res.main.temp_max + '°_\n'; // jshint ignore:line
      description += '>Humidité : _' + res.main.humidity + '%_\n';
      description += '>Pression : _' + res.main.pressure + ' hPa_\n';
      description += '>Visibilité : _' + res.visibility / 1000 + ' km_\n';
      description += '>Vent : _' + res.wind.speed + ' km/h_';
      var message = {message: {
        attachments: [{
          title: `Météo à ${location}`,
          text: description,
          thumb_url: imageUrl, // jshint ignore:line
          color: 'black'
        }]}
      };
      return resolve(message);
    });
  });
}

function handleWeather({ entities: { location: location = "" } }) {
  let finalLocation = location[0];
  return getWeather({ phrase: finalLocation });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.