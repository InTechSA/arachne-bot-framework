/*
  SKILL : alarms
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
  'alarm': {
    cmd: "alarm",
    execute: alarmHandler
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
  'confirmation': {
    name: "confirmation",
    interact: handleConfirmation
  }
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ['node-schedule'];
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

// Load alarms from database if any.
overseer.StorageManager.getItem("alarms", "alarms").then((alarms) => {
  if (!alarms) {
    return;
  }
  const today = new Date();
  let alarmsToKeep = []

  for (let alarm of alarms) {
    const alarmDate = new Date(alarm.date);

    if (alarmDate > today) {
      schedule.scheduleJob(alarmDate, () => {
        overseer.HookManager.execute(alarm.hook, {
          message: {
            title: "Alarm",
            text: alarm.text,
          }
        }, {deleteHook: true}).catch((err) => {
          if (err == overseer.HookManager.codes.NO_HOOK) {
            overseer.StorageManager.getItem("alarms", "alarms").then((storage) => {
              let alarms = [];
              if (storage) {
                alarms = storage.filter((a) => a.hook !== alarm.hook);
              }
      
              overseer.StorageManager.storeItem("alarms", "alarms", alarms).then().catch((err) => console.log(err));
            }).catch((err) => console.log(err));
          }
        });
      });

      alarmsToKeep.push(alarm);
    }
  }
  
  overseer.StorageManager.storeItem("alarms", "alarms", alarmsToKeep).then().catch((err) => console.log(err));
}).catch((err) => {
  console.log(err);
});

/**
  Handler for command alarm (!alarm).

  Params :
  --------
    phrase: String
*/
function alarmHandler({ phrase, data }) {
  return new Promise((resolve, reject) => {
    let time = new Date();
    let text = "";

    try {
      let [timeString, ...textString] = phrase.split(" ");
      text = textString ? textString.join(" ") : "";
      // Checking time format.
      let [hours, minutes] = timeString.split(/[:h\-]/i); // eslint-disable-line no-useless-escape
      hours = parseInt(hours, 10);
      minutes = parseInt(minutes, 10);
      if (isNaN(hours) || hours < 0 || hours > 24) {
        throw new Error("Invalid hour format.");
      }
      if (isNaN(minutes) || minutes < 0 || minutes >= 60) {
        throw new Error("Invalid minutes format.");
      }
      time.setHours(hours, minutes, 0, 0);
    } catch(e) {
      console.log(e);
      // Invalid time format.
      return resolve({
        message: {
          title: "Invalid time format",
          text: "Type `!alarm hh:mm` to create a new alarm."
        }
      })
    }
   return resolve({
       message: {
           interactive: true,
           thread: {
                source: phrase,
                data: [
                    ["time", time],
                    ["text", text]
                ],
                handler: "confirmation"
           },
           title: "Set a alarm.",
           text: `Will set an alarm for today, ${time.toLocaleTimeString()}, is that correct ? (o/N)`
       }
   });
  });
}
/**
  Handler for interaction confirmation.

  Params :
  --------
    phrase: String
*/
function handleConfirmation(thread, { phrase, data }) {
  return new Promise((resolve, reject) => {
    let time = new Date(thread.getData("time"));
    let text = thread.getData("text");

    // Close Thread.
    let response = "Aborted";
    if (["oui", "yes", "o", "oui!", "yes!"].includes(phrase)) {
        response = "Ok! Alarm set today at " + time.toLocaleTimeString()
    }

    overseer.HookManager.create("alarms","Alarme utilise qu'une seule fois !").then((hook) => {
      schedule.scheduleJob(time, () => {
        overseer.HookManager.execute(hook._id, {
          message: {
            title: "Alarm",
            text: text
          }
        }, {deleteHook: true}).catch((err) => {
          if (err == overseer.HookManager.codes.NO_HOOK) {
            overseer.StorageManager.getItem("alarms", "alarms").then((storage) => {
              let alarms = [];
              if (storage) {
                alarms = storage.filter((a) => a.hook !== hook._id);
              }
      
              overseer.StorageManager.storeItem("alarms", "alarms", alarms).then().catch((err) => console.log(err));
            }).catch((err) => console.log(err));
          }
        });
      });
      overseer.StorageManager.getItem("alarms", "alarms").then((storage) => {
        let alarms = [];
        if (storage) {
          alarms = storage;
        }

        alarms.push({ date: time, hook: hook._id, text });

        overseer.StorageManager.storeItem("alarms", "alarms", alarms).then().catch((err) => console.log(err));
      }).catch((err) => console.log(err));
      return resolve({
          message: {
              title: "Alarm ",
              text: response,
              request_hook: true,
              hook: hook
          }
      });
    }).catch((err) => {
      console.log(err);
      return reject(err);
    });
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.