/*
  SKILL : tea
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    const schedule = skill.loadModule('node-schedule');

    skill.addCommand("tea", "set-tea-alarm", ({ phrase, data }) => {
        return new Promise((resolve, reject) => {
            try {
                let [teaType, ...textString] = phrase.split(" ");

                // Checking tea format
                let time = 0; // minutes
                let image = "https://imgur.com/cm2YcD5.jpg";
                switch (teaType) {
                    case "green":
                    case "vert":
                        time = 3;
                        image = "https://imgur.com/cm2YcD5.jpg";
                        break;
                    case "black":
                    case "noir":
                        time = 5;
                        image = "https://imgur.com/VKn1RuC.jpg";
                        break;
                    case "herbs":
                    case "infusion":
                    case "herbes":
                        time = 7;
                        image = "https://imgur.com/i1DjTDi.jpg";
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
                    skill.createHook().then((hook) => {
                        schedule.scheduleJob(new Date(new Date().getTime() + time * 60000), () => {
                            skill.userHook(hook._id, {
                                message: {
                                    title: "It's Tea Time!",
                                    text: "Your tea is ready! Run, Forest! Run!",
                                    attachments: [{
                                        image_url: image
                                    }]
                                }
                            }, { deleteHook: true }).catch((err) => skill.log(err));
                        });
                        return resolve({
                            message: {
                                title: "Tea Timer",
                                text: "Okay! I'll remind your in " + time + " minutes :)",
                                request_hook: true,
                                hook
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
    }, {
        description: "Tea maker"
    });

    skill.addIntent("tea-alarm", "set-tea-alarm", ({ entities, data }) => {
        return Promise.resolve().then(() => {
            return {
                message: {
                    title: "Not implemented",
                    text: "Type `!tea green|black|herbs` to set a timer."
                }
            };
        });
    });
}