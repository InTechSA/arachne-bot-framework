/*
  SKILL : croissant
  AUTHOR : Anonymous
  DATE : 11/06/2018
*/

module.exports = (skill) => {
    
    var token_Croissant = null;
    var token_Croissant_expiration=null;
    const axios = skill.loadModule("axios");
    const croissant_endpoint = "https://croissant-app.intech-lab.com";
    
    function getCroissantAuth() {
        return new Promise((resolve, reject) => {
            if(!token_Croissant || token_Croissant_expiration<=Date.now()){ // Le token est null ou il a expiré
                skill.log("Token croissant null or expired, refreshing it ... ");
                var username = process.env.USERNAMEBOT || skill.getSecret().username;
                var password = process.env.PASSWORDBOT || skill.getSecret().password;
                return axios({
                    url: croissant_endpoint + "/auth",
                    method: 'POST',
                    data: {
                        username,
                        password
                    }
                }).then((response) => {
                    skill.log("Token refreshed");
                    token_Croissant = response.data.token;
                    token_Croissant_expiration = response.data.expiresAt *1000;
                    skill.log("Sending token croissant ... ");
                    return resolve(token_Croissant);
                }).catch((err) => {
                    token_Croissant = null;
                    skill.log(err);
                    return reject("Error when refreshing token for croissant microservice :thinking:");
                });
            }
            else{
                return resolve(token_Croissant);   
            }
        });
    }
    
    skill.addPipe('croissantPipeHandler', (pipeIdentifier, { hookId, data, headers }) => {
        skill.getItem("initedHook").then((hookTab) => {
            skill.log( "Error retrieved the hooks");
            hookTab.map((el) => el = skil.useHook(el.hookID, {
                message:{
                    title: "RAPPEL CROISSANT",
                    text: "C'est à toi de ramener les croissants cette semaine !!'",
                    private: true,
                    privateName: data.userName
                }
            }, { deleteHook: false }));
            skill.log(hookTab);
            skill.log("executing promise all");
            return Promise.all(hookTab);
        }).catch((err) => {
            skill.log(err);
        });
    });
    
    skill.addCommand("croissant","croissant", ({ phrase, data }) => {
        return Promise.resolve().then(() => {
            phrase = phrase.replace("croissant","").trim();
            phrase = phrase.split(" ");
            switch(phrase[0]) {
                case "init":
                    return skill.getItem("initedHook").then((initedHook) => {
                        if(initedHook && initedHook.filter(el => el.adapter.toString() === data.connector.id.toString()).length > 0) {
                            return({
                                message: {
                                    title: "Hook request",
                                    text: "Hook already exist for croissant !!",
                                }
                            });
                        } else {
                            if(initedHook) {
                                return skill.createHook().then((hook) => {
                                    initedHook.push({adapter: data.connector.id, hookID: hook._id});
                                    return skill.storeItem("croissant","initedHook",initedHook).then((stored) => {
                                        return resolve({
                                            message: {
                                                title: "Hook request",
                                                text: "Ok hook created, ready to roll :)",
                                                request_hook: true,
                                                hook: hook
                                            }
                                        });
                                    });
                                });
                            } else {
                                skill.createPipe("croissantPipeHandler",{withHook: true}).then(pipe => {
                                    skill.log("Successfully created pipe");
                                    skill.log(pipe);
                                    if(!initedHook) initedHook = [];
                                    initedHook.push({adapter: data.connector.id, hookID: pipe.hook._id});
                                    return skill.storeItem("initedHook",initedHook).then((storage) => {
                                        return({
                                            message: {
                                                title: "Hook request",
                                                text: "Ok hook and pipe created, ready to roll :), pipeIdentifier : "+pipe.identifier,
                                                request_hook: true,
                                                hook: pipe.hook
                                            }
                                        });
                                    });
                                });
                            }
                        }
                    });
                case "me": 
                    return getCroissantAuth().then((token) => {
                        return axios({
                            url: croissant_endpoint + "/myTurn/"+data.userName,
                            headers: {
                                'Authorization': token,
                                'Accept': 'application/json'
                            }
                        }).then((response) => {
                            return({
                                message: {
                                    title: "Date de passage "+data.userName,
                                    text: "Ta prochaine date de passage pour les croissants est le : "+response.data.date+" !"
                                }
                            });
                        }).catch((err) => {
                            if(err.response.status === 404) {
                                throw "Vous n'êtes pas dans la liste des croissants :(";
                            } else {
                                throw "Une erreur est survenue en contactant le microservice croissant :/";
                            }
                        });
                    });
                case "duo": 
                    return getCroissantAuth().then((token) => {
                         return axios({
                            url: croissant_endpoint + "/duoThisWeek",
                            headers: {
                                'Authorization': token,
                                'Accept': 'application/json'
                            }
                        }).then((response) => {
                            return({
                                message: {
                                    title: "Duo cette semaine",
                                    text: "Le prochain mercredi c'est au tour de "+ (response.data.tri1 || "personne :(") +" et de "+ (response.data.tri2 || "personne :(") + " de ramener les croissants !"
                                }
                            });
                        }).catch((err) => {
                            if(err.response.status === 404) {
                                throw "Vous n'êtes pas dans la liste des croissants :(";
                            } else {
                                throw "Une erreur est survenue en contactant le microservice croissant :/";
                            }
                        });
                    });
                default:
                    throw "Je n'ai pas compris votre demande :(, tapez `!croissant help` pour consulter la liste des commandes !";
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
    }, {
        description: "Commande associé au microservice croissant",
        "subcommands":[
            {
                "name":"get-passage",
                "cmd":"me",
                "description":"Récupère la date de votre prochain passage pour les croissants et vous la retourne",
                "examples":[
                    {
                        "phrase":"croissant me",
                        "action":"Renvoie votre prochaine date de passage"
                    }
                ]
            },
            {
                "name":"get-duo",
                "cmd":"duo",
                "description":"Retoune le prochain duo qui doit passer",
                "examples":[
                    {
                        "phrase":"croissant duo",
                        "action":"Renvoie le prochain duo a passer"
                    }
                ]
            }
        ]
    });
};
