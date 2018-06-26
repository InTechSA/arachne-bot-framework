/*
  SKILL : alarms
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    
    const schedule = skill.loadModule('node-schedule');
    var alarmsTab = [];
    
    function getAndDeleteAlarm(hook,oneOrRepeat) {
        if(oneOrRepeat !== "repeat") {
            skill.getItem("alarms").then((alarms) => {
                if (!alarms) alarms = [];
                alarms = alarms.filter((a) => a.hook.toString() !== hook.toString());
                alarmsTab = alarmsTab.filter((alarm) => alarm.ID.toString() !== hook.toString());
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
                scheduleRule.hour = alarmDate.split(':')[0];
                scheduleRule.minute = alarmDate.split(':')[1];
                alarmDate = scheduleRule;
                deleteHook = false;
            }
            var scheduleObj = schedule.scheduleJob(alarmDate, () => {
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
        if (!alarms) return;
        const Promises = [];
        const today = new Date();
        let alarmsToKeep = [];
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
            alarmsTab = schedulesObjs;
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
                    return skill.getItem("alarms").then((alarms) => {
                        var text = "";
                        skill.log(alarmsTab);
                        alarms = alarms.filter((alarm) => alarm.channel === data.channel);
                        if(!alarms || alarms.length === 0) {
                            text += "Pas d'alarmes enregistrés !"+"\n"+" tapez `!alarms [one|repeat] [hh:mm] [texte]` pour créer une nouvelle alarme";
                        } else {
                            alarms.map((alarm) => {
                                if(alarm.oneOrRepeat === "repeat") text += " - Prochaine alarme prévu à : "+alarm.date+", texte associé : "+alarm.text+", récurrence : tous les jours ,ID : "+alarm.hook + "\n";
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
                        var iremTab = alarmsTab.findIndex((alarmTab) => alarmTab.ID.toString() === ID.toString());
                        if(iremTab !== -1) {
                            alarmsTab[iremTab].scheduleObj.cancel();
                            alarmsTab.splice(iremTab,1);
                        }
                        if(irem === -1) {
                            throw "Pas d'alarme avec cet ID :/";
                        } else {
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
                            text = `Will set an alarm everyday at ${time.toLocaleTimeString()}, is that correct ? (o/N)`;
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
                                    handler: "confirmation"
                                },
                                title: "Set a alarm.",
                                text
                            }
                        });
                    } catch(e) {
                        skill.log(e);
                        // Invalid time format.
                        return({
                            message: {
                                title: "Invalid time format",
                                text: "Type `!alarms hh:mm` to create a new alarm."
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
    });
    
    skill.addInteraction("confirmation", (thread, { phrase, data }) => {
        return Promise.resolve().then(() => {
            let response = "Aborted";
            if (["oui", "yes", "o", "oui!", "yes!", "Yes"].includes(phrase)) {
                let time = new Date(thread.getData("time"));
                let text = thread.getData("text");
                let oneOrRepeat = thread.getData("oneOrRepeat");
                response = "Ok! Alarm set today at " + time.toLocaleTimeString();
                response += "\n" + "You can see your alarms by typing `!alarms list`";
                return skill.createHook().then((hook) => {
                    return skill.getItem("alarms").then((alarms) => {
                        if (!alarms) alarms = [];
                        if(oneOrRepeat === "repeat") time = time.getHours() + ":"+time.getMinutes();
                        return scheduleAlarm(hook._id, time, text,oneOrRepeat).then((scheduleObj) => {
                            alarms.push({ date: time, hook: hook._id, text , oneOrRepeat, channel: data.channel});
                            alarmsTab.push({ID: hook._id,scheduleObj: scheduleObj.scheduleObj});
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
                        alarms.push({ date: time, hook: hook._id, text });
                        return skill.storeItem("alarms", alarms).then(() => {
                            return({
                                message: {
                                    title: "Alarm ",
                                    text: response,
                                    request_hook: true,
                                    hook: hook
                                }
                            });
                        });
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