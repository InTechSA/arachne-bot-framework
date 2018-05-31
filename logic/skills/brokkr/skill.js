/*
  SKILL : brokkr
  AUTHOR : Anonymous
  DATE : 28/05/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'brokkr': {
    cmd: "brokkr",
    execute: brokkr
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'brokkr-list-apps': {
    slug: "list-apps",
    handle: handleListApps,
    expected_entities: ["client"]
  },
  'brokkr-app-logs': {
    slug: "app_logs",
    handle: handleAppLogs,
    expected_entities: ["client", "application"]
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
let dependencies = ["axios"];
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
const axios = require('axios');

/**
  Handler for command list-apps (!brokkr apps).

  Params :
  --------
    phrase: String
*/
function listApps({ phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    axios({
        method: "GET",
        url: `http://192.168.6.156/clients/${phrase}/apps`,
        data: { app_token: "2MJKSKPXWAKJHT2ZMZDELN64ZRYH6G" },
        timeout: 5000
    }).then(res => {
        console.log(res);
        let text = "";
        res.data.content.forEach(app => {
           text += `- *${app.name}*: _${app.status}_\n`
        });
        return resolve({
            message: {
                title: `Applications sur ${phrase}`,
                text
            }
        });
    }).catch(err => {
        console.log(err);
        return resolve({
            message: {
                title: 'Could not get applications list.',
                text: 'The Brokkr service is not accessible.'
            }
        });
    });
  });
}

function appLogs({ phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    const [client, app] = phrase.split(" ");
    
    axios({
        method: "GET",
        url: `http://192.168.6.156/clients/${client}/apps/${app}/logs`,
        data: { app_token: "2MJKSKPXWAKJHT2ZMZDELN64ZRYH6G" },
        timeout: 5000
    }).then(res => {
        let text = res.data.content;
        return resolve({
            message: {
                title: `Applications sur ${phrase}`,
                text: text.substring(text.length - 2000, text.length)
            }
        });
    }).catch(err => {
        console.log(err);
        return resolve({
            message: {
                title: 'Could not get applications list.',
                text: 'The Brokkr service is not accessible.'
            }
        });
    });
  });
}

function brokkr({ phrase, data }) {
    const [cmd, ...params] = phrase.split(" ");
    if (cmd === "apps") {
        return listApps({ phrase: params.join(" "), data });
    } else if (cmd === "logs") {
        return appLogs({ phrase: params.join(" "), data });
    } else {
        return Promise.resolve({
            message: {
                title: "Not implemented",
                text: "This functionnality is currently not implemented."
            }
        });
    }
}
/**
  Handler for intent brokkr-list-apps (LIST-APPS).

  Params :
  --------
    entities (Object)
*/
function handleListApps({ entities: { 'client': client = {}}, data }) {
  return listApps({ phrase: client[0] });
}
/**
  Handler for intent brokkr-app-logs (app-logs).

  Params :
  --------
    entities (Object)
*/
function handleAppLogs({ entities: { 'client': client = {}, 'application': application = {}}, data }) {
  return appLogs({ phrase: client[0] + " " + application[0] })
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.