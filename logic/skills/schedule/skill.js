/*
	SKILL : schedule
	UTHOR : "Anonymous"
	DATE : 03/07/2018
*/

module.exports = (skill) => {
    
    const axios = skill.loadModule("axios");
    
    function parserEDT(events) {
        var text = "";
        var start,end;
        for(var event of events) {
            start = new Date((event.start + 7200 )* 1000);
            end = new Date((event.end + 7200) * 1000);
            start = (start.getHours()<10?"0"+start.getHours():start.getHours())+':'+(start.getMinutes()<10?"0"+start.getMinutes():start.getMinutes());
            end = (end.getHours()<10?"0"+end.getHours():end.getHours())+':'+(end.getMinutes()<10?"0"+end.getMinutes():end.getMinutes());
            text += "Occupée de : "+start+" à " + end + "\n";
        }
        return text;
    }
    
    skill.addCommand("schedule","schedule",({phrase, data}) => {
        return Promise.resolve().then(() => {
            if (phrase.length === 0 || phrase.length !== 3) {
                return({
                    message: {
                        text: "Renseignez un trigramme valide svp, `!schedule [trigram]`"
                    }
                });
            } else {
                return skill.execute('getToken', {phrase, data}).then((response) => {
                    const token = response.response.token;
                    phrase = phrase.replace("schedule","").trim();
                    var url = "http://si-ad.intech.lu/users/by-trigram/" + phrase;
                    return axios({
                        url,
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Accept': 'application/json'
                        }
                    }).then((response) => {
                        var mailUser = response.data.email;
                        var displayName = response.data.displayName;
                        var start = new Date();
                        start.setHours(0);
                        start.setMinutes(0);
                        start.setSeconds(0);
                        var end = new Date(Date.parse(start) + 3600000 * 24 - 1000);
                        start = Math.floor(Date.parse(start) / 1000);
                        end = Math.floor(Date.parse(end) / 1000);
                        url = "http://si-exch.intech.lu/schedule/user/"+mailUser+"?start="+start+"&end="+end;
                        return axios({
                            url,
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Accept': 'application/json'
                            }
                        }).then((response) => {
                            var events = response.data.events;
                            if(events.length === 0 ) {
                                return({
                                    message: {
                                        text: "Rien de prévu pour " + displayName + " aujourd'hui"
                                    }
                                });
                            } else {
                                skill.log(displayName);
                                skill.log(parserEDT(events));
                                return({
                                    message: {
                                        attachments: [{
                                            title: "Emploi du temps aujourd'hui de " + displayName,
                                            text: parserEDT(events)
                                        }]
                                    }
                                });    
                            }
                        }).catch((err) => {
                            skill.log(err.message);
                            throw 'Error with the si-exch';
                        });
                    }).catch((err) => {
                        skill.log(err.message);
                        if(err.response.status === 404) {
                            throw "Je n'ai trouvé personne avec le trigramme "+phrase + " :/";
                        } else {
                            throw "Error with the SI-AD";
                        }
                    });
                }).catch((error) => {
                    if(typeof(error) !== String) error = error.toString();
                    skill.log("Error : " + error);
                    return({
                        message: {
                            title: "Error",
                            text: error
                        }
                    });
                });
            }
        });
    }, {
        description: "Getting the schedule of an user"
    });
    
    
};