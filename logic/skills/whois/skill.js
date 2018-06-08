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
const ActiveDirectoryEndpoint = "http://si-ad.intech.lu";

const request = require('request');
/**
  Handler for command whois (!whois).

  Params :
  --------
    phrase: String
*/
function parserUser(result) {
    var messages;
    var photo = "https://secure.gravatar.com/avatar/4beba8b7f3907e4649a5a5ea410acede?s=100&d=mm&r=g";
    if (result.photo) {
        photo = "data:image/png;base64," + result.photo;
    }
    messages = '*Informations disponibles sur ' + result.trigram + '* \n';
    messages += '> *Trigramme:* ' + result.trigram + '\n';
    messages += '> *Nom:* ' + result.lastName + '\n';
    messages += '> *Prénom:* ' + result.firstName + '\n';
    if (result.email) {
        // Print the email of the user
        messages += '> *Email:* ' + result.email + '\n';
    }
    if (result.telephone && result.telephone.trim().length > 0) {
        // Print the telephone number of the user
        messages += '> *Téléphone:* ' + result.telephone + '\n';
    }
    if (result.mobile && result.mobile.trim().length > 0) {
        // Print the mobile number of the user
        messages += '> *Mobile:* ' + result.mobile + '\n';
    }
    if (result.manager) {
        // Print the manager of the user
        messages += '> *Manager:* ' + result.manager.userName.replace('.', ' ') + ' (' + result.manager.trigram + ')' + '\n';
    }
    if (result.groups) {
        // Print the role of the user
        messages += '> *Rôle:* ' + result.groups.join(',') + '\n';
    }
    if (result.division && result.division.trim().length > 0) {
        // Print the division of the user
        messages += '> *Pôle:* ' + result.division + '\n';
    }
    return ({
        title: "Whois " + result.displayName,
        attachments: [
            {
                color: "black",
                image_url: photo,
                text: messages
            }
        ]
    });
}

function parserSuggestions(queryWhois, suggestions) {
    var messages = "* Didn't find any person with this trigram/username, did you mean : *\n";
    for (var i = 0; i < suggestions.length; i++) {
        messages += "> _ Username : " + suggestions[i].userName + " , Trigram : " + suggestions[i].trigram + " _ \n";
    }
    return ({
        title: "Whois - not found " + queryWhois,
        text: messages
    });
}

function suggestions(userQuery, token, byUsername = false) {
    return new Promise((resolve, reject) => {
        overseer.log("whois","Suggestions :: Retrieving all users infos");
        getUserInfos(null, token, false, true).then((users) => {
            var obj = 'trigram';
            if(byUsername) {
                obj = 'userName';
            }
            users.map(val => {
                val.sim = levenshteinDistance(val[obj],userQuery);
            });
            users.sort((a,b) => { return a.sim - b.sim });
            users.splice(5,users.length - 4);
            return resolve(users);
        }).catch((err) => {
            console.log(err);
            return reject(err);
        }); 
    });
}

function levenshteinDistance(a, b){
  if(a.length === 0) return b.length; 
  if(b.length === 0) return a.length; 
  var matrix = [];
  var i;
  for(i = 0; i <= b.length; i++){
    matrix[i] = [i];
  }
  var j;
  for(j = 0; j <= a.length; j++){
    matrix[0][j] = j;
  }
  for(i = 1; i <= b.length; i++){
    for(j = 1; j <= a.length; j++){
      if(b.charAt(i-1) == a.charAt(j-1)){
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
}

function getUserInfos(user, token, byUsername = false, allUsers = false) {
    return new Promise((resolve, reject) => {
        //Form the url used for the AD API, composed with the trigram of the user
        let endPoint = ActiveDirectoryEndpoint + '/users/by-trigram/' + user;
        // if the data have to be retrieve by username
        if (byUsername) {
            // will form the url using the user name
            endPoint = ActiveDirectoryEndpoint + '/users/' + user;
        }
        if (allUsers) {
            endPoint = ActiveDirectoryEndpoint + '/users?cache=false&fields=';
        }
        overseer.log("whois", 'getUserInfos :: url : ' + endPoint);
        var options = {
            url: encodeURI(endPoint),
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            }
        };
        try {
            request(options, (err, res, body) => {
                if (err) {
                    overseer.log("whois","getUserInfos :: Error " + err);
                    return reject(err);
                }
                if (res.statusCode !== 200) {
                    overseer.log("whois",'getUserInfos :: StatusCode different than 200');
                    err = { code: res.statusCode };
                    return reject(err);
                }
                overseer.log("whois","getUserInfos :: StatusCode equal to 200, return body");
                try{
                    var result = JSON.parse(body);
                    return resolve(result);
                } catch(e) {
                    return reject(e);
                }
            });
        } catch(e) {
            overseer.log("whois", e);
        }
    });
}

function whoisHandler({ phrase }) {
    return new Promise((resolve, reject) => {
        var query = phrase.trim().replace('whois', '');
        overseer.log("whois", query);
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
        overseer.handleCommand('get-ad-token').then((response) => {
            const token = response.response.token;
            overseer.log("whois", "Retrieved Token");
            if (query.length === 3) {
                overseer.log("whois", "By trigram");
                getUserInfos(query, token).then((body) => {
                    return resolve({ sucess: true, message: parserUser(body) })
                }).catch(() => {
                    overseer.log("whois", "Suggestions");
                    suggestions(query,token).then((suggestions) => {
                        return resolve({sucess:true, message: parserSuggestions(query,suggestions)});
                    }).catch((err) => {
                        console.log(err);
                        return resolve({sucess: true, message: {text: err}});
                    });
                });
            } else {
                query = query.replace(" ",".");
                overseer.log("whois", "By username");
                getUserInfos(query, token, true).then((body) => {
                    return resolve({ sucess: true, message: parserUser(body) })
                }).catch(() => {
                    overseer.log("whois", "Suggestions");
                    suggestions(query,token,true).then((suggestions) => {
                        return resolve({sucess:true, message: parserSuggestions(query,suggestions)});
                    }).catch((err) => {
                        return resolve({sucess: true, message: {text: err}});
                    });
                });
            }
        }).catch((error) => {
            overseer.log("whois", "Catch error in command get-ad-token " + error);
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
function nlpWhois({ entities: { 'trigram': trigram = {} }, data }) {
    return new Promise((resolve, reject) => {
        /*
          >>> YOUR CODE HERE <<<
          resolve the handler with a formatted message object.
        */
        overseer.log("whois", trigram);
        overseer.log("whois", "Nlp Whois");
        whoisHandler({ phrase: "whois " + trigram }).then((message) => {
            return resolve(message);
        }).catch((message) => {
            return reject(message);
        });
    });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.