/*
  SKILL : alarms
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    
    const schedule = skill.loadModule('node-schedule');
    
    // Load alarms from database if any.
    skill.getItem("alarms").then((alarms) => {
      if (!alarms) {
        return;
      }
      const today = new Date();
      let alarmsToKeep = []
    
      for (let alarm of alarms) {
        const alarmDate = new Date(alarm.date);
    
        if (alarmDate > today) {
          schedule.scheduleJob(alarmDate, () => {
            skill.useHook(alarm.hook, {
              message: {
                title: "Alarm",
                text: alarm.text,
              }
            }, {deleteHook: true}).catch((err) => {
              if (err === 'NO_HOOK') {
                skill.getItem("alarms").then((storage) => {
                  let alarms = [];
                  if (storage) {
                    alarms = storage.filter((a) => a.hook !== alarm.hook);
                  }
          
                  skill.storeItem("alarms", alarms).then().catch((err) => skill.log(err));
                }).catch((err) => skill.log(err));
              }
            });
          });
          alarmsToKeep.push(alarm);
        }
      }
      
      skill.storeItem("alarms", alarmsToKeep).then().catch((err) => skill.log(err));
    }).catch((err) => {
      skill.log(err);
    });
    
    skill.addCommand("alarms","alarms",({ phrase, data }) => {
      return Promise.resolve().then(() => {
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
          skill.log(e);
          // Invalid time format.
          return({
            message: {
              title: "Invalid time format",
              text: "Type `!alarm hh:mm` to create a new alarm."
            }
          });
        }
       return({
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
    },{
        description: "Create an alarm",
        "subcommands":
        [
            {
                "name":"create-alarms",
                "cmd":"",
                "description":"Crée une alarme avec une heure précise ( doit être au format HH:mm )",
                "parameters":
                [
                    {
                        "position":0,
                        "name":"heure",
                        "description":"L'heure a laquelle l'alarme va se déclencher ",
                        "example":"12:00"
                    }
                ],
                "examples":
                [
                    {
                        "phrase":"alarms 12:00",
                        "action":"Crée une alarme à 12:00"
                    }
                ]
            }
        ]
    });
    
    skill.addInteraction("confirmation", (thread, { phrase, data }) => {
        return Promise.resolve().then(() => {
            let time = new Date(thread.getData("time"));
            let text = thread.getData("text");
            // Close Thread.
            let response = "Aborted";
            if (["oui", "yes", "o", "oui!", "yes!"].includes(phrase)) {
                response = "Ok! Alarm set today at " + time.toLocaleTimeString();
            }
            time.setHours(time.getHours()-2);
            return skill.createHook().then((hook) => {
                schedule.scheduleJob(time, () => {
                    skill.useHook(hook._id, {
                      message: {
                        title: "Alarm",
                        text: text
                      }
                    }, {deleteHook: true}).catch((err) => {
                        if (err === 'NO_HOOK') {
                            skill.getItem("alarms", "alarms").then((storage) => {
                                let alarms = [];
                                if (storage) {
                                    alarms = storage.filter((a) => a.hook !== hook._id);
                                }
                                skill.storeItem("alarms", alarms).then().catch((err) => skill.log(err));
                            }).catch((err) => skill.log(err));
                        }
                    });
                });
                skill.getItem("alarms").then((storage) => {
                    let alarms = [];
                    if (storage) {
                      alarms = storage;
                    }
                    alarms.push({ date: time, hook: hook._id, text });
                    skill.storeItem("alarms", alarms).then().catch((err) => skill.log(err));
                }).catch((err) => skill.log(err));
                return({
                    message: {
                        title: "Alarm ",
                        text: response,
                        request_hook: true,
                        hook: hook
                    }
                });
            }).catch((err) => {
              skill.log(err);
              return({
                    message: {
                        title: "Alarm ",
                        text: "Something went wrong when creating the alarm :("
                    }
                });
            });
        }).catch((err) => {
            if(typeof(err) !== String) err = err.toString();
            skill.log("Error : " + err);
            return({
                message: {
                    title: "Error",
                    text: err
                }
            }); 
        });
    });
};
/* </SKILL LOGIC> */