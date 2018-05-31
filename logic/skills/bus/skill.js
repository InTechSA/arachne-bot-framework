/*
  SKILL : bus
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
  'bus': {
    cmd: "bus",
    execute: busHandler
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'bus-bus': {
    slug: "bus",
    handle: handleBus,
    expected_entities: []
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
/**
  Handler for command bus (!bus).

  Params :
  --------
    phrase: String
*/
function busHandler({phrase}) {
    return new Promise((resolve, reject) => {
      // The url for the bus api
        var url = "http://travelplanner.mobiliteit.lu/restproxy/departureBoard?accessId=cdt&id=A=1@O=Kayl,%20Rue%20de%20Noertzange@X=6,049390@Y=49,496072@U=82@L=220601018@B=1@p=1521640094&format=json&direction=A=1@O=Luxembourg,%20Gare%20Centrale@X=6,133745@Y=49,600625@U=82@L=200405035@B=1@p=1521640094&rtMode=FULL&duration=60&lines=197";
        request({
            url: url,
            method: 'GET',
            timeout: 3000
        },(err,res,body)=>{
          // We parse the body
          try{
            var result = JSON.parse(body);
            // We build the return message
            var messages = "> Bus Partant de "+result.Departure[0].stop+" en direction de "+result.Departure[0].direction+" avec le "+result.Departure[0].name+"\n";
            messages += "> Premier Bus : \n";
            messages += "> Heure de départ prévue "+result.Departure[0].time+"\n";
            messages += "> Heure de départ réelle "+result.Departure[0].rtTime+"\n";
            messages += "> Bus d'après : \n";
            messages += "> Heure de départ prévue "+result.Departure[1].time+"\n";
            // We return the response
            return resolve({ message: { text: messages } });
          } catch(e) {
            console.log("Erreur : "+e);
            return resolve({ message: { text: "Impossible de récupérer les horaires de bus." }});
          }
        });
    });
}
/**
  Handler for intent bus-bus (bus).

  Params :
  --------
    entities (Object)
*/
function handleBus({ entities: {}, data, phrase }) {
  return busHandler({ phrase });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.