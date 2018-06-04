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

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let pipes = {
    'hookHandler': {
        name: 'hookHandler',
        transmit: hookHandler
    }
};
/* </SKILL DEPENDENCIES> */

// Exposing the skill definition.
exports.commands = commands;
exports.intents = intents;
exports.dependencies = dependencies;
exports.interactions = interactions;
exports.pipes = pipes;

/*
  Skill logic begins here.
  You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
*/
/* <SKILL LOGIC> */
const overseer = require('../../overseer');

function hookHandler(pipeIdentifier, { data }) {
    return overseer.StorageManager.getItem("github", "hooks").then((storage) => {
        console.log(data);
        if (!storage) {
            let error = new Error("No hooks in storage for this skill to use.")
            throw error;
        }

        let hook = storage.find(hook => hook.pipe == pipeIdentifier);
        if (!hook) {
            let error = new Error("No available hook for this pipe.");
            throw error;
        }
        
        console.log(hook);
        
        // Retrieve hook linked to this pipe.
        
        // Parsing webhook event and building message object.
        let message = {};
        console.log(data.object_kind);
        if (data.object_kind) {
            // This is a gitlab wehbook event.
            if (data.object_kind === "pipeline") {
                // This is a pipeline event.
                if (data.object_attributes.status === "success") {
                    message.title = `Pipeline for ${data.project.name} is successfull.`
                    message.text = `Your pipeline for branch ${data.object_attributes.ref} is a success. It was started by ${data.commit.author.name}.`
                    message.attachments = data.builds.map(build => {
                        return {
                            title: `${build.name} for stage ${build.stage}`,
                            text: `Status: **${build.status}**`,
                            color: build.status ? "#00AA00" : "#AA0000"
                        }
                    });
                } else {
                    message.title = `Pipeline for ${data.project.name}: ${data.object_attributes.status}.`
                    message.text = `Your pipeline for branch ${data.object_attributes.ref} returned the code **${data.object_attributes.status}**. It was started by ${data.commit.author.name}.`
                }
            } else {
                message.title = `${data.object_kind} event detected on ${data.project.name || "a"} repository.`;
            }
        } else {
            message.title = 'Bip bip, activity detected on a repository!';
        }
        
        return overseer.HookManager.execute(hook.id, {
            message
        });
    });
}

function githubCommand({ phrase, data }) {
  return new Promise((resolve, reject) => {
    const args = phrase.split(" ");
    if (args.length > 0) {
        let hookName;
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
                
                if (!args[1]) {
                    return resolve({
                        message: {
                            title: "Github ♦ Missing hook name.",
                            text: "> `!github attach <hookName>` to create a new hook."
                        }
                    });
                }
                
                hookName = args[1].trim();
                
                overseer.HookManager.create("github").then((hook) => {
                    overseer.StorageManager.getItem("github", "hooks").then((storage) => {
                        overseer.PipeManager.create("github", "hookHandler").then(pipe => {
                            let hooks = storage || [];
                            
                            hooks.push({
                                channel: data.channel,
                                id: hook._id,
                                pipe: pipe.identifier,
                                name: hookName
                            });
                            
                            overseer.StorageManager.storeItem("github", "hooks", hooks).then(() => {
                                return resolve({
                                    message: {
                                        title: "Github ♦ Hook",
                                        text: `Your webhook \`${hookName}\` is ready to alert you! The url is ` + "https://arachne-bot.intech-lab.com/pipes/github/" + pipe.identifier,
                                        request_hook: true,
                                        hook: hook
                                    }
                                });
                            }).catch();
                        });
                    }).catch();
                }).catch(); 
                break;
            case "detach":
                if (!args[1]) {
                    return resolve({
                        message: {
                            title: "Github ♦ Detach hooks.",
                            text: "> `!github detach <hookid>` to detach a hook. Type `!github list` to get list of hooks in this channel."
                        }
                    });
                }
                hookName = args[1].trim();
                // detach
                if (!data.channel) {
                  return resolve({
                    message: {
                      title: "Github ♦ Cannot detach hook.",
                      text: "Skill can not identify this channel. Hook deletion cannot fulfill."
                    }
                  });
                }
                overseer.StorageManager.getItem("github", "hooks").then((hooks) => {
                    let hookIndex = hooks.findIndex(hook => hook.channel == data.channel && hook.name == hookName);
                      if (hookIndex < 0) {
                        return resolve({
                          message: {
                            title: "Github ♦ Cannot detach hook.",
                            text: "I can't identify the hook to delete, make sure the hook name is correct."
                          }
                        });
                      }
                    
                  overseer.HookManager.remove(hooks[hookIndex].id).then(() => {
                    hooks.splice(hookIndex, 1);
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
            case "list":
                overseer.StorageManager.getItem("github", "hooks").then((hooks) => {
                    const found = hooks.filter(hook => hook.channel == data.channel);
                    return resolve({
                       message: {
                          title: "Github ♦ Hooks for this channel.",
                          text: found.map(hook => `• *${hook.name}* - pipe: _${hook.pipe}_.`).join("\n")
                        }
                   });
                }).catch(err => {
                    console.log(err);
                   return resolve({
                       message: {
                          title: "Github ♦ Could not get hooks.",
                          text: "I was unable to get the list of git hooks here, i'm sorry :'("
                        }
                   });
                });
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
        text: "> `!github attach <hookName>` to attach a webhook.\n> `!github detach <hookName>` to detach a webhook.\n> `!github list` to list hooks.\n\n(Hook names cannot contain whitespaces)"
    }
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.