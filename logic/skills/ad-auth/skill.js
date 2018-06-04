/*
  SKILL : ad-auth
  AUTHOR : Anonymous
  DATE : 03/04/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/
// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'get-ad-token': {
    cmd: "get-ad-token",
    execute: getToken
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ["request"];
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
var token_AD = null;
var token_expiration = null;
const request = require('request');
/**
 * Get a New Token from AD and store the new token in r2d2's brain and the expiration date of the new token
 * @param next the next method that will be executed if the method run wihtout error
 * @return the next function to execute with the parameter err and the new accessToken
 */
function refreshAccessToken(next) {
  var username = process.env.USERNAMEBOT || require("./secret").username;
  var password = process.env.PASSWORDBOT || require("./secret").password;
  var ServiceQuery = "username="+username+"&password="+password;
  request({
    headers: {
        'Content-Length': ServiceQuery.length,
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    uri: 'https://si-ad.intech.lu/authentication',
    body: ServiceQuery,
    method: 'POST'
  }, (err, res) => {
    next(err,res);
  });
}

/**
  Handler for command get-token (!get-token).

  Params :
  --------
    phrase: String
*/
function getToken({phrase}) {
  return new Promise((resolve, reject) => {
    if(!token_AD && token_expiration<=Date.now()){ // Le token est null ou il a expiré
      console.log("Token null or expired, refreshing it ... ");
      refreshAccessToken((err,res)=>{
        if(err || res.statusCode !== 201){
          console.log("Error :  "+res.statusCode+" when refreshing token, please contact administrator");
          token_AD = null;
          return reject("Error :  "+res.statusCode+" when refreshing token, please contact administrator");
        }
        else{
          var responseToken = JSON.parse(res.body);
          token_AD = responseToken.accessToken;
          token_expiration = responseToken.expiresAt *1000;
        }
        console.log("Sending token ... ");
        return resolve({
          message: {
            title: "Unauthorized",
            text: "You are not allowed to execute this command.",
            color: "red"
          },
          token: token_AD
        });
      });
    }
    else{
      console.log("Token valid, sending token ... ");
      return resolve({
        message: {
          title: "Unauthorized",
          text: "You are not allowed to execute this command.",
          color: "red"
        },
        token: token_AD
      });
    }
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.
