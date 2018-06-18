/*
  SKILL : weather
  AUTHOR : System
  DATE : 17/04/2018
*/

module.exports = (skill) => {
  const request = require('request');
  const token = require('./secret').token;
  const weatherApi = `http://api.openweathermap.org/data/2.5/weather?APPID=${token}&lang=fr&units=metric`;
  const weatherIcon = 'http://openweathermap.org/img/w/';

  skill.addCommand("weather", "weather", ({ phrase, data }) => {
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
            skill.log("weather", e);
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
  });

  skill.addIntent("weather", "weather", ({ entities: { location: location = [] }, data }) => {
      if (location.length === 0) {
        return Promise.resolve({ message: { text: "I am expecting a location." }});
      } else {
        return skill.handleCommand("weather", { phrase: location[0], data });   
      }
  });
}