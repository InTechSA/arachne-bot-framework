/*
  SKILL : whois
  AUTHOR : Anonymous
  DATE : 29/03/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/
// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
    'whois': {
        cmd: "whois",
        execute: whoisHandler
    }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'whois-whois': {
    slug: "whois",
    handle: nlpWhois,
    expected_entities: ["trigram"]
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
const overseer = require('../../overseer');
var url_whois_micro = process.env.WHOIS_URL_MICROSERVICE || "http://localhost:8000";


const request = require('request');
/**
  Handler for command whois (!whois).

  Params :
  --------
    phrase: String
*/
function whoisHandler({ phrase }) {
    return new Promise((resolve, reject) => {
        var query = phrase.trim().replace('whois', '');
        console.log(query);
        var message = {};
        if (query === 'help') {
            message = {
                title: "Whois Help",
                text: "Pour avoir des informations sur un collaborateurs, tapez soit :\n" +
                    "\n" + ">!whois [trigram] ou !whois [prenom].[nom] de la personne recherché \n" +
                    "> Ou tapez directement Qui est [trigram], Donne moi les informations sur [prenom].[nom]"
            }
            return resolve({
                success: true,
                message: message
            });
        }
        console.log("Retreiving token ... ");
        overseer.handleCommand('get-ad-token').then((response) => {
            console.log("Retrieve Token");
            var url = url_whois_micro + "/searchWhois/" + query;
            console.log(url);
            var options = {
                url: encodeURI(url),
                headers: {
                    'Authorization': 'Bearer ' + response.response.token,
                    'Accept': 'application/json'
                }
            };
            request(options, (err, res, body) => {
                var messages;
                if (err || res.statusCode !== 200) {
                    if(!body) {
                       messages = 'Something went wrong looking for the infos of ' + query + "\n";
                        messages += 'Error : MicroService Whois is probably down :/ ';
                        message = {
                            title: "Whois - error",
                            text: messages
                        };
                    } 
                    else {
                        message = JSON.parse(body);
                    }
                } else {
                    message = JSON.parse(body);
                }
                return resolve({
                    success: true,
                    message: message
                });
            });
        }).catch((error) => {
            console.log("Catch error in command get-ad-token " + error);
            /* Handle the error of this command here */
            message.text = error;
            return resolve({
                success: false,
                message: message
            });
        });
    });
}
/**
  Handler for intent whois-whois (whois).

  Params :
  --------
    entities (Object)
*/
function nlpWhois({ entities: { 'trigram': trigram = {}}, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
   console.log(trigram);
    console.log("Nlp Whois");
    whoisHandler({phrase :"whois "+trigram}).then((message) => {
        return resolve(message);
    }).catch((message) => {
        return reject(message);
    });
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.