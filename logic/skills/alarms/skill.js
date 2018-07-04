/*
  SKILL : alarms
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    
    const schedule = skill.loadModule('node-schedule');
    
    function getAndDeleteAlarm(hook,oneOrRepeat) {
        if(oneOrRepeat !== "repeat") {
            skill.getItem("alarms").then((alarms) => {
                if (!alarms) alarms = [];
                alarms = alarms.filter((a) => a.hook.toString() !== hook.toString());
                skill.storeItem("alarms", alarms).then(() => {
                    skill.log("Deleted");
                }).catch((err) => skill.log(err));
            }).catch((err) => skill.log(err));
        }
    }
    
    function scheduleAlarm(hook, alarmDate, alarmText,oneOrRepeat) {
        return Promise.resolve().then(() => {
            var deleteHook = true;
            if(oneOrRepeat === "repeat") {
                var scheduleRule;
                scheduleRule = new schedule.RecurrenceRule();
                scheduleRule.hour = parseInt(alarmDate.split(':')[0]) - 2;
                if(scheduleRule.hour < 0 ) {
                    scheduleRule.hour = schedule.hour + 24;
                }
                scheduleRule.minute = alarmDate.split(':')[1];
                scheduleRule.dayOfWeek = new schedule.Range(1, 5);
                alarmDate = scheduleRule;
                deleteHook = false;
            } else {
                alarmDate = new Date(alarmDate - (2* 3600000));
                skill.log(alarmDate);
            }
            
            var scheduleObj = schedule.scheduleJob(hook.toString(), alarmDate, () => {
                if (oneOrRepeat === "one") {
                    scheduleObj.cancel();
                }
                skill.useHook(hook, {
                    message: {
                        title: "Alarm",
                        text: alarmText
                    }
                }, {deleteHook}).then(() => {
                    getAndDeleteAlarm(hook,oneOrRepeat);
                }).catch((err) => {
                    getAndDeleteAlarm(hook,"one");
                });
            });
            return {ID: hook,scheduleObj};
        });
    }
    
    // Load alarms from database if any.
    skill.getItem("alarms").then((alarms) => {
        skill.log("Loading alarms:");
        skill.log(alarms);
        if (!alarms) return;
        const Promises = [];
        const today = new Date();
        let alarmsToKeep = [];
        
        // Cancel all current jobs if any.
        skill.log("Removing and scheduled jobs.");
        skill.log(schedule.scheduledJobs);
        for (let job in schedule.scheduledJobs) {
            schedule.cancelJob(job)
        }
                    
        for (let alarm of alarms) {
            if(alarm.oneOrRepeat !== "repeat" ) {
                var alarmDate = new Date(alarm.date);
                if ( alarmDate > today) {
                    Promises.push(scheduleAlarm(alarm.hook,alarmDate,alarm.text,alarm.oneOrRepeat));
                    alarmsToKeep.push(alarm);
                } 
            } else {
                Promises.push(scheduleAlarm(alarm.hook, alarm.date, alarm.text, alarm.oneOrRepeat));
                alarmsToKeep.push(alarm);
            }
        }
        Promise.all(Promises).then((schedulesObjs) => {
            skill.storeItem("alarms", alarmsToKeep).then().catch((err) => skill.log(err));
        });
    }).catch((err) => {
        skill.log(err);
    });
    
    skill.addCommand("alarms","alarms",({ phrase, data }) => {
        return Promise.resolve().then(() => {
            phrase = phrase.replace("alarms","").trim();
            var subCmds = phrase.split(" ");
            switch(subCmds[0]) {
                case "list":
                    skill.log("Jobs:");
                    for (let job in schedule.scheduledJobs) {
                        skill.log(job);
                    }
                    return skill.getItem("alarms").then((alarms) => {
                        var text = "";
                        alarms = alarms ? alarms.filter((alarm) => alarm.channel === data.channel) : null;
                        if(!alarms || alarms.length === 0) {
                            text += "Pas d'alarmes enregistrés !"+"\n"+" tapez `!alarms [one|repeat] [hh:mm] [texte]` pour créer une nouvelle alarme";
                        } else {
                            alarms.map((alarm) => {
                                if(alarm.oneOrRepeat === "repeat") text += " - Prochaine alarme prévu à : "+alarm.date.split(':')[0] + ":" + (alarm.date.split(':')[1]<10?"0":"") + alarm.date.split(':')[1] +", texte associé : "+alarm.text+", récurrence : tous les jours ,ID : "+alarm.hook + "\n";
                                else text += " - Alarme prévu à : "+alarm.date+", texte associé : "+alarm.text+", récurrence : une seule fois, ID : "+alarm.hook + "\n";
                            });
                            text += "Tapez `!alarms delete [ID]` pour supprimer une alarme.";
                        }
                        return({
                            message: {
                                title: "Liste des alarmes dans ce channel : ",
                                text
                            }
                        });
                    });
                case "delete":
                    var ID = subCmds[1];
                    return skill.getItem("alarms").then((alarms) => {
                        var irem = alarms.findIndex((alarm) => alarm.hook.toString() === ID.toString());
                        if(irem === -1) {
                            throw "Pas d'alarme avec cet ID :/";
                        } else {
                            schedule.cancelJob(ID.toString());
                            alarms.splice(irem,1);
                            return skill.storeItem("alarms",alarms).then(() => {
                                return skill.useHook(ID, { 
                                    message: {
                                        title: "Alarme bien supprimée",
                                        text: "Alarme avec l'ID " + ID + " bien supprimé"
                                    }
                                }, { deleteHook: true }).then(() => {
                                    return ({
                                        message: {
                                            text:""
                                        }
                                    });
                                }).catch((err) => {
                                   return ({
                                       message: {
                                           text: "No hooks find :thinking: maybe the hook was already deleted, still deleted the alarms from the list !"
                                       }
                                   }) 
                                });
                            });
                        }
                    });
                default:
                    let time = new Date();
                    try {
                        let [oneOrRepeat, timeString, ...textString] = subCmds;
                        if(!["one","repeat"].includes(oneOrRepeat)) {
                            textString = textString ? textString.join(" ") + timeString : timeString;
                            timeString = oneOrRepeat;
                            oneOrRepeat = "one";
                        } else {
                            textString = textString ? textString.join(" ") : "Alarme sans nom";
                        }
                        // Checking time format.
                        let [hours, minutes] = timeString.split(/[:h\-]/i); // eslint-disable-line no-useless-escape
                        hours = parseInt(hours, 10);
                        minutes = parseInt(minutes, 10);
                        if (isNaN(hours) || hours < 0 || hours > 24) {
                            throw "Invalid hour format.";
                        }
                        if (isNaN(minutes) || minutes < 0 || minutes >= 60) {
                            throw "Invalid minutes format.";
                        }
                        time.setHours(hours, minutes, 0, 0);
                        var text = `Will set an alarm for today, ${time.toLocaleTimeString()}, is that correct ? (o/N)`;
                        if(oneOrRepeat === "repeat") {
                            text = `Will set an alarm everyday at `+ timeString +`, is that correct ? (o/N)`;
                        }
                        return({
                            message: {
                                interactive: true,
                                thread: {
                                    source: phrase,
                                    data: [
                                        ["time", time],
                                        ["text", textString],
                                        ["oneOrRepeat", oneOrRepeat]
                                    ],
                                    handler: "confirmation",
                                    timeout: 10
                                },
                                title: "Set a alarm.",
                                text
                            }
                        });
                    } catch(e) {
                        // Invalid time format.
                        return({
                            message: {
                                title: "Invalid time format",
                                text: "Type `!alarms [one|repeat] [hh:mm] [message]` to create a new alarm."
                            }
                        });
                    }
            }
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
    },{
        description: "Crée une alarme avec une heure précise ( doit être au format HH:mm )",
        "parameters":
        [
            {
                "position":0,
                "name":"one|repeat",
                "description":"Si l'alarme doit être une fois ou tous les jours",
                "example":"one"
            },
            {
                "position":1,
                "name":"heure",
                "description":"L'heure a laquelle l'alarme va se déclencher ",
                "example":"12:00"
            },
            {
                "position":2,
                "name":"AlarmText",
                "description":"Le text affichée lorsque l'alarme sonne",
                "example":"LT!!"
            }
        ],
        "examples":
        [
            {
                "phrase":"alarms one 12:00 MANGER",
                "action":"Crée une alarme à 12:00 une seule fois"
            },
            {
                "phrase":"alarms repeat 9:45 LT!!",
                "action":"Crée une alarme à 9h45 tout les jours"
            }
        ],
        "subcommands":[
            {
                "name":"liste",
                "cmd":"list",
                "description":"Affiche la liste des alarmes dans le channel courant"
            },
            {
                "name":"delete",
                "cmd":"delete",
                "description":"Supprime une alarme en mettant en paramètre son ID (l'ID peut être trouvé en tapant `!alarms list` ",
                "parameters":[
                    {
                        "position":0,
                        "name":"ID",
                        "description":"ID de l'alarme",
                        "example":"0000000000000"
                    }
                ],
                "examples":[
                    {
                        "phrase":"alarms delete 000000000000",
                        "action":"Supprime l'alarme avec l'ID 000000000000"
                    }
                ]
            }
        ]
    });
    
    skill.addInteraction("confirmation", (thread, { phrase, data }) => {
        return Promise.resolve().then(() => {
            let response = "Aborted";
            if (["oui", "yes", "o", "oui!", "yes!", "Yes"].includes(phrase)) {
                let time = new Date(thread.getData("time"));
                let text = thread.getData("text");
                let oneOrRepeat = thread.getData("oneOrRepeat");
                if(oneOrRepeat === "repeat") {
                    time = time.getHours() + ":"+time.getMinutes();
                    response = "Ok ! Alarm set everyday at " + time;
                }
                else response = "Ok! Alarm set today at " + time.toLocaleTimeString();
                response += "\n" + "You can see your alarms by typing `!alarms list`";
                return skill.createHook().then((hook) => {
                    return skill.getItem("alarms").then((alarms) => {
                        if (!alarms) alarms = [];
                        return scheduleAlarm(hook._id, time, text,oneOrRepeat).then((scheduleObj) => {
                            alarms.push({ date: time, hook: hook._id, text , oneOrRepeat, channel: data.channel});
                            return skill.storeItem("alarms",alarms).then(() => {
                                return({
                                    message: {
                                        title: "Alarm",
                                        text: response,
                                        request_hook: true,
                                        hook: hook
                                    }
                                });
                            });
                        });
                    });
                });
            } else {
                if(["non", "n", "N", "no", "No"].includes(phrase)) {
                    return ({
                        message: {
                            text: response
                        }
                    });
                } else {
                    return({
                        message: {
                            text: "I didn't understood your answer, please reponse by Yes or No",
                            interactive: true
                        }
                    });
                }
            }
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