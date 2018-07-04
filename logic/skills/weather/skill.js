/*
  SKILL : weather
  AUTHOR : System
  DATE : 17/04/2018
*/

module.exports = (skill) => {

    const axios = skill.loadModule('axios');
    const token = skill.getSecret().token;
    const weatherApi = `http://api.openweathermap.org/data/2.5/weather?APPID=${token}&lang=fr&units=metric`;
    const weatherIcon = 'http://openweathermap.org/img/w/';

    skill.addCommand("weather", "weather", ({ phrase, data }) => {
        return Promise.resolve().then(() => {
            // Build the request
            let location = phrase.trim().replace("weather", "").trim();
            if (location === '') {
                location = 'Kayl,lu';
            }
            let query = "&q=" + location;
            // Make the query
            return axios({
                url: weatherApi + query,
                method: 'GET',
            }).then((res) => {
                res = res.data;
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
                return {
                    message: {
                        attachments: [{
                        title: `Météo à ${location}`,
                        text: description,
                        thumb_url: imageUrl, // jshint ignore:line
                        color: 'black'
                    }]}
                };
            }).catch((error) => {
                throw "Couldn't contact the weather API";
            });
        }).catch((error) => {
            if(typeof(error) !== String) error = error.toString();
            skill.log("Error : " + error);
            return({
                message: {
                    title: "Error",
                    text: error
                }
            });  
        });
    }, {
        description: "Récupère le temps actuel à un lieux donné",
        "parameters":[
            {
                "position":0,
                "name":"lieux",
                "description":"lieux où le temps doit être cherché",
                "example":"luxembourg ville"
            }
        ],
        "examples":[
            {
                "phrase":"weather Paris",
                "action":"renvoie le temps à paris"
            },
            {
                "phrase":"weather Metz",
                "action":"renvoie le temps à Metz"
            }
        ]
    });
    
    skill.addIntent("weather", "weather", ({ entities: { location: location = [] }, data }) => {
        if (location.length === 0) {
            return Promise.resolve({ message: { text: "I am expecting a location." }});
        } else {
            return skill.handleCommand("weather", { phrase: location[0], data });   
        }
    },{
        description: "Intent pour avoir le temps d'un endroit",
        examples: [
            {
                action: "Affiche le temps actuellemnt d'un lieux",
                phrases: [
                    "Quel est le temps à Paris ?",
                    "Quel temps fait-il à Kayl ?",
                    "Météo à grenoble"
                ]
            }]
    });
}