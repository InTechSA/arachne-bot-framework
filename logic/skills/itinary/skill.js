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
/**
  Handler for command itinary (!itinary).

  Params :
  --------
    phrase: String
*/
function itinaryHandler({phrase}) {
  return new Promise((resolve, reject) => {
    // The google api_key used for the request !!Link to my personnal account for the moment!!!
    const GOOGLE_API_KEY = "AIzaSyA2rKD68MbznvV5YlFJG3XDIfUHjYAB1zc";
    console.log("Itinary");
    // Split the request to have the origin of the itinary and the destination
        var req = phrase.split("->");
        if(req[1]){
            var des = req[1];
            var ori = req[0];
        } else{
            var des = req[0];
            // If the oriign is not specified, it will be Intech
            var ori = "Intech%20S.A.,Luxembourg";
        }
        if(des == "help"){
          // If the destionation is help, then print the help
            var messages = "> Help of the itinary command : \n";
            messages += "> To do an itinary starting from Intech and going to a destination type : !itinary your_destination\n";
            messages += "> To do an itinary starting from a and going to b, type !itinary a -> b\n";
            messages += "> CAREFUL, if the destination is not in France, add the country of the destination at the end of it after a comma\n";
            messages += "> Example : !itinary Bruxelles, Belgium -> Kayl, Luxembourg";
        }
        else{
          // Build the url
            const url = "https://maps.googleapis.com/maps/api/directions/json?origin="+ori+"&destination="+des+"&departure_time=now&traffic_model=best_guess&key="+GOOGLE_API_KEY;
            request({
              url: url,
              method: 'GET'
            }, function(err,res,body) {
              // Response message
                if (err || (res.statusCode !== 200)) {
                    var messages = 'Something went wrong looking for your itinary';
                } else {
                  // Everything went fine, parsing of the body
                    const response = JSON.parse(body);
                    if(response.status!=="OK"){
                      // No itinary found
                      var messages = "Il n'existe pas d'itinéraire entre les deux lieux renseignés :(";
                    }
                    else{
                      // Itinary found, we print it
                        const response = JSON.parse(body);
                        const route = response.routes[0];
                        const start_address = route.legs[0].start_address;
                        const end_address = route.legs[0].end_address;
                        var messages = "* Voila votre itinéraire : *\n";
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
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.