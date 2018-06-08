/*
  SKILL : itinary
  AUTHOR : Anonymous
  DATE : 30/03/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/
// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'itinary': {
    cmd: "itinary",
    execute: itinaryHandler
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'itinary-get-itinary': {
    slug: "get-itinary",
    handle: handleItinary,
    expected_entities: ["location"]
  }
};
/* </SKILL INTENTS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ["request"];
/* </SKILL DEPENDENCIES> */

// Exposing the skill definition.
exports.commands = commands;
exports.intents = intents;
exports.dependencies = dependencies;

/*
  Skill logic begins here.
  You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
*/
/* <SKILL LOGIC> */

const request = require('request');
const GOOGLE_API_KEY = require('./secret').google_api_key;
const overseer = require('../../overseer');

/**
  Handler for command itinary (!itinary).

  Params :
  --------
    phrase: String
*/
function itinaryHandler({phrase}) {
  return new Promise((resolve, reject) => {
    // The google api_key used for the request !!Link to my personnal account for the moment!!!
    overseer.log("itinary", "Itinary");
    // Split the request to have the origin of the itinary and the destination
        var req = phrase.split("->");
        var des,ori,messages;
        if(req[1]){
            des = encodeURI(req[1]);
            ori = encodeURI(req[0]);
        } else{
            des = encodeURI(req[0]);
            // If the oriign is not specified, it will be Intech
            ori = "Intech%20S.A.,Luxembourg";
        }
        if(des == "help"){
          // If the destionation is help, then print the help
            messages = "> Help of the itinary command : \n";
            messages += "> To do an itinary starting from Intech and going to a destination type : !itinary your_destination\n";
            messages += "> To do an itinary starting from a and going to b, type !itinary a -> b\n";
            messages += "> CAREFUL, if the destination is not in France, add the country of the destination at the end of it after a comma\n";
            messages += "> Example : !itinary Bruxelles, Belgium -> Kayl, Luxembourg";
        }
        else{
          // Build the url
            const url = "https://maps.googleapis.com/maps/api/directions/json?origin="+ori+"&destination="+des+"&departure_time=now&traffic_model=best_guess&key="+GOOGLE_API_KEY;
            overseer.log("itinary", "URl sent : "+url);
            request({
              url: url,
              method: 'GET'
            }, function(err,res,body) {
              // Response message
                if (err || (res.statusCode !== 200)) {
                    overseer.log("itinary", "Error "+err);
                    overseer.log("itinary", "Status code : "+res.statusCode)
                    var messages = 'Something went wrong looking for your itinary';
                } else {
                  // Everything went fine, parsing of the body
                    const response = JSON.parse(body);
                    if(response.status!=="OK"){
                      // No itinary found
                      messages = "Il n'existe pas d'itinéraire entre les deux lieux renseignés :(";
                    }
                    else{
                      // Itinary found, we print it
                        const response = JSON.parse(body);
                        const route = response.routes[0];
                        const start_address = route.legs[0].start_address;
                        const end_address = route.legs[0].end_address;
                        messages = "* Voila votre itinéraire : *\n";
                        messages += "> Départ : "+start_address+"\n";
                        messages += "> Arrivée : "+end_address+"\n";
                        messages += "> Temps estimé minimum : "+route.legs[0].duration.text+"\n";
                        messages += "> Temps éstimé maximum : "+route.legs[0].duration_in_traffic.text+"\n";
                        messages += "> Route conseillée : "+route.summary;
                    }
                }
                // We return the message built
                return resolve({message:{
                  title: "Itinary",
                  text: messages
                }
                });
            });
        }
  });
}
/**
  Handler for intent itinary-get-itinary (get-itinary).

  Params :
  --------
    entities (Object)
*/
function handleItinary({ entities: { 'location': location = {}}, data }) {
    overseer.log("itinary", location);
    let phrase = location.length >= 2 ? location[0] + "->" + location[1] : location[0]
    return itinaryHandler({ phrase, data });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.