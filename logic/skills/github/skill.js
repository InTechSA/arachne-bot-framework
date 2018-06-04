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

function hookHandler(pipeIdentifier, { data }) {
    console.log(data);
    
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
                        text: `Status: **${build.status}**`
                    }
                });
            } else {
                message.title = `Pipeline for ${data.project.name}: ${data.object_attributes.status}.`
                message.text = `Your pipeline for branch ${data.object_attributes.ref} returned the code **${data.object_attributes.status}**. It was started by ${data.commit.author.name}.`
            }
        }
    } else {
        message.title = 'Bip bip, activity detected on repository!';
    }
    
    console.log(message);
    
    return overseer.HookManager.execute(pipeIdentifier, {
        message
    });
}

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
                        
                        hooks[data.channel] = {
                            id: hook._id,
                        };
                        
                        overseer.StorageManager.storeItem("github", "hooks", hooks).then(() => {
                            overseer.PipeManager.create("github", hook._id.toString(), hookHandler).then(pipe => {
                                return resolve({
                                      message: {
                                          title: "Github ♦ Hook",
                                          text: "Your webhook is ready to alert you! The url is " + "https://arachne-bot.intech-lab.com/pipes/github/" + pipe.identifier,
                                          request_hook: true,
                                          hook: hook
                                      }
                                  });
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