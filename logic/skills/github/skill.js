/*
  SKILL : github
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'github': {
    cmd: "github",
    execute: githubCommand
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
let dependencies = [];
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
const overseer = require('../../overseer');

/**
  Handler for command github (!github).

  Params :
  --------
    phrase: String
*/
function githubCommand({ phrase, data }) {
  return new Promise((resolve, reject) => {
    const args = phrase.split(" ");
    if (args.length > 0) {
        switch (args[0]) {
            case "attach":
                // attach
                if (!data.channel) {
                  return resolve({
                    message: {
                      title: "Github ♦ Cannot create hook.",
                      text: "Skill can not identify this channel. Hook creation cannot fulfill."
                    }
                  });
                }
                overseer.HookManager.create("github").then((hook) => {
                  overseer.StorageManager.getItem("github", "hooks").then((storage) => {
                    let hooks = {};
                    if (storage) {
                      hooks = storage;
                    }
                    hooks[data.channel] = hook._id;
                    
                    overseer.StorageManager.storeItem("github", "hooks", hooks).then(() => {
                      return resolve({
                          message: {
                              title: "Github ♦ Hook",
                              text: "Your webhook is ready to alert you!",
                              request_hook: true,
                              hook_id: hook._id
                          }
                      });
                    }).catch();
                  }).catch();
                }).catch();
                break;
            case "detach":
                // detach
                if (!data.channel) {
                  return resolve({
                    message: {
                      title: "Github ♦ Cannot dettach hook.",
                      text: "Skill can not identify this channel. Hook deletion cannot fulfill."
                    }
                  });
                }
                overseer.StorageManager.getItem("github", "hooks").then((hooks) => {
                  if (!hooks[data.channel]) {
                    return resolve({
                      message: {
                        title: "Github ♦ Cannot detach hook.",
                        text: "Skill can not identify this channel. No hooks are running here."
                      }
                    });
                  }

                  overseer.HookManager.remove(hooks[data.channel]).then(() => {
                    delete hooks[data.channel];
                    overseer.StorageManager.storeItem("github", "hooks", hooks).then(() => {
                      return resolve({
                        message: {
                          title: "Github ♦ Hook deleted.",
                          text: "The Github Hook in this channel was successfully removed."
                        }
                      });
                    }).catch();
                  });
                }).catch();
                break;
            default:
                //help
                return resolve({
                    message: helpMessage()
                });
        }
    } else {
        return resolve({
            message: helpMessage()
        });
    }
  });
}

function helpMessage() {
    return {
        title: "GITHUB ♦ Help",
        text: "> `!github attach` to attach a webhook.\n> `!github detach` to detach a webhook."
    }
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.