# Skill Example : Hooks

The _tea_ skill will trigger hooks for simple alarms in a channel.

```javascript
/*
  SKILL : tea
  AUTHOR : Anonymous
  DATE : 25/04/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'set-tea-alarm': {
    cmd: "tea",
    execute: commandTea
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'tea-set-tea-alarm': {
    slug: "tea-alarm",
    handle: handleTeaIntent,
    expected_entities: ["tea-type"]
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
let dependencies = ["node-schedule"];
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
const schedule = require('node-schedule');

/**
  Handler for intent tea-set-tea-alarm (tea-alarm).

  Params :
  --------
    entities (Object)
*/
function handleTeaIntent({ entities: { 'tea-type': teatype = {}}, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    return resolve({
      message: {
        title: "Not implemented",
        text: "This functionnality is currently not implemented."
      }
    });
  });
}

/**
  Handler for command set-tea-alarm (!tea).

  Params :
  --------
    phrase: String
*/
function commandTea({ phrase, data }) {
  return new Promise((resolve, reject) => {
    try {
        let [teaType, ...textString] = phrase.split(" ");
        let text = textString ? textString.join(" ") : "";
        
        // Checking tea format
        let time = 0; // minutes
        let image = "https://cdn.pixabay.com/photo/2017/10/04/12/10/peppermint-2816012_960_720.jpg";
        switch (teaType) {
            case "green":
            case "vert":
                time = 3;
                image = "https://cdn.pixabay.com/photo/2017/10/04/12/10/peppermint-2816012_960_720.jpg";
                break;
            case "black":
            case "noir":
                time = 5;
                image = "https://cdn.pixabay.com/photo/2015/07/01/08/42/oolong-827397_960_720.jpg";
                break;
            case "herbs":
            case "infusion":
            case "herbes":
                time = 7;
                image = "https://cdn.pixabay.com/photo/2018/04/02/17/10/hibiscus-3284431_960_720.jpg";
                break;
            default:
                time = 0;
        }
        if (time == 0) {
            return resolve({
                message: {
                    title: "Tea Timer",
                    text: "Type `!tea <green|black|herbs>` to set a timer for your tea."
                }
            });
        } else {
            // Set timer.
            overseer.HookManager.create("tea").then((hook) => {
                schedule.scheduleJob(new Date(new Date().getTime() + time*60000), () => {
                    overseer.HookManager.execute(hook._id, {
                        message: {
                            title: "It's Tea Time!",
                            text: "Your tea is ready! Run, Forest! Run!",
                            attachments: [{
                                image_url: image
                            }]
                        }
                    }).catch((err) => console.log(err));
                });
                return resolve({
                    message: {
                        title: "Tea Timer",
                        text: "Okay! I'll remind your in " + time + " minutes :)",
                        request_hook: true,
                        hook_id: hook._id
                    }
                })
            }).catch((err) => {
                return resolve({
                    message: {
                        title: "Tea Timer",
                        text: "Tea Timer cannot set a hook in this channel, sorry."
                    }
                })
            });
        }
    } catch (e) {
        return resolve({
            message: {
                title: "Tea Timer",
                text: "Type `!tea <green|black|herbs>` to set a timer for your tea."
            }
        });
    }
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.
```
