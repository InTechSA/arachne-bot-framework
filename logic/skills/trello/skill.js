/*
  SKILL : trello
  AUTHOR : Anonymous
  DATE : 20/06/2018
*/

module.exports = (skill) => {

    const API_KEY = skill.getSecret().API_KEY;
    const apiTrelloUrl = "https://api.trello.com/1";
    const axios = skill.loadModule('axios');
    

    function send(text, title, priv,noLinkParsing, interactive, hook, thread) {
        var message = {};
        if(title) message.title = title;
        if(interactive) message.interactive = true;
        if(hook) message.request_hook = true;message.hook = hook;
        if(priv) message.private = true;
        if(thread) message.thread = thread;
        if(noLinkParsing) message.noLinkParsing = true;
        message.text = text;
        return({message});
    }

    function attachWebhook(pipe, idModel, webHooks,nameModel, channel, tokenUser) {
        var url = apiTrelloUrl + `/webhooks?key=${API_KEY}&token=${tokenUser}`;
        skill.log("URL "+url);
        return axios({
            method: "post",
            url,
            data: {
                description: "Création de webhook automatisé",
                callbackURL: "https://arachne-bot.intech-lab.com/pipes/trello/" + pipe.identifier,
                idModel,
                active: true
            }
        }).then((response) => {
            webHooks.push({id: response.data.id,channel: channel, pipeID: pipe._id, hookID: pipe.hookID,idModel,nameModel});
            skill.log(webHooks);
            return skill.storeItem("webHooks",webHooks)
            .then(() => {
                return send("Pipe and webhook to trello was successfully created !\n"+"You will now receive notifications when the board"+
                " has a modification", "Success",false,false,false,pipe.hook);
            }).catch((err) => {
                return send("Une erreur est survenue, veuillez réesayer ultérieurement", "Error");
            });
        }).catch((err) => {
            return send("Erreur en contactant l'API trello : " + err,"Error");
        });
    }

    skill.addInteraction("authTrello", (thread, { phrase, data }) => {
        return Promise.resolve()
        .then(() => {
            if(phrase.length !== 64) {
                return send("Votre token n'a pas la bonne taille, veuillez entrer UNIQUEMENT le token","Token invalide",true,false,true);
            } else {
                return axios({
                    url: apiTrelloUrl + `/tokens/${phrase}?token=${phrase}&key=${API_KEY}`
                }).then((response) => {
                    return skill.getItem("keyTab")
                    .then((keyTab) => {
                        if(!keyTab) keyTab = [];
                        keyTab.push({userName:data.userName, tokenUser: phrase, idMember:response.data.idMember });
                        return skill.storeItem("keyTab",keyTab)
                        .then(() => {
                            return send("Votre token a bien été enregistré !","Success !",true);
                        });
                    });
                }).catch((err) => {
                    return send("Je n'ai pas pu contacter l'API trello ou votre token est invalide ! :/",true);
                });
            }
        }).catch(err => {
            if(typeof(err) !== String) err = err.toString();
            skill.log("Error : " + err);
            return({
                message: {
                    title: "Error",
                    text: err,
                    private: true
                }
            }); 
        });
    });

    skill.addPipe("trelloPipeHandler",(pipeIdentifier, {  data, headers, hookId }) => {
        try {
            let text = data.action.display.translationKey.replace(/_/g," ");
            let entities = data.action.display.entities;
            
            if (data.action.display.translationKey === "action_move_card_from_list_to_list") {
                skill.log(entities)
                text = entities["card"].text + " : " + entities["listBefore"].text + " → " + entities["listAfter"].text + " (by " + entities["memberCreator"].text + ").";
            } else {
                for(let i in entities) {
                  if(text.includes(entities[i].type)) {
                    text = text.replace(entities[i].type,entities[i].text);
                  }
                }    
            }
            
            return skill.useHook(hookId, {
                message: {
                    title: "Trello notif",
                    text: "Un nouvel evenement est arrivée sur le board " + data.model.name + "\n"
                    + "Description de l'évenement : " + text + "\n"
                    + "Par : " + data.action.memberCreator.fullName
                }
            }, {deleteHook: false});
        } catch(e) {
            skill.log(e.message);
        }
    });

    skill.addCommand("trello","trello",({ phrase, data }) => {
        phrase = phrase.replace("trello","").trim();
        return Promise.resolve()
        .then(() => {
            return skill.getItem("keyTab");
        })
        .then((keyTab) => {
            if(!keyTab || keyTab.filter(el => el.userName === data.userName).length === 0) {
                if(!data.privateChannel) {
                    return send("Token trello requis", "Je n'ai pas votre token personnel, tapez !trello pour commencer la demande.",true);
                } else {
                    var thread = {
                        source: "Trello demand",
                        handler: "authTrello",
                        duration: 59,
                        timeout_message: "Vous avez pris trop de temps !"
                    };
                    return send("Pour utiliser l'API de trello, j'ai besoin que vous confirmiez autoriser Trello pour vous donné une clé.\n"+
                            `Pour cela, allez sur le lien suivant : https://trello.com/1/authorize?expiration=never&name=MyPersonalToken&scope=read&response_type=token&key=${API_KEY}`+"\n"+
                            `Puis coller le token donné dans le chat et envoyer le moi :)`,"Autoriser Trello",true,true,true,false,thread);
                }
            } else {
                phrase = phrase.split(" ");
                var tokenUser = keyTab.filter(el => el.userName === data.userName)[0].tokenUser;
                switch(phrase[0]) {
                    case "boards":
                        return axios({
                            method: 'get',
                            url: apiTrelloUrl + `/members/me/boards?key=${API_KEY}&token=${tokenUser}`
                        })
                        .then((response) => {
                            var outText = "";
                            response.data.map((el) => {
                                outText += el.name + " lien : " + `[Lien](${el.shortUrl})` + "\n";
                            });
                            return send(outText,"Vos tableaux :",true,true);
                        }).catch((err) => {
                            skill.log("Error : "+err);
                            return send("Une erreur est survenue en contactant l'API de trello "+err,"Error",true);
                        });
                    case "attach":
                        return skill.getItem('webHooks').then((webHooks) => {
                            if(!webHooks) webHooks = [];
                            var nameModel = phrase[1];
                            if(phrase[1] === "me") nameModel = data.userName;
                            if(webHooks.filter(val => val.channel === data.channel && val.nameModel === nameModel).length > 0) {
                                return send("There is already a webHook for this channel and name ! Type `!trello detach "+phrase[1]+"` to detach the actual webhook");
                            } else {
                                return skill.createPipe("trelloPipeHandler", {withHook: true}).then((pipe) => {
                                    skill.log("OK, pipe : " + pipe.toString());
                                    if(phrase[1] !== "me") {
                                        return axios({
                                            method: 'get',
                                            url: apiTrelloUrl + `/members/me/boards?key=${API_KEY}&token=${tokenUser}`
                                        })
                                        .then((response) => {
                                            if(response.data.filter(el => el.name === phrase[1]).length === 0) {
                                                return send("Vous n'avez pas de board avec le nom fournie :/, tapez `!trello boards` pour avoir la liste de vos boards");
                                            } else {
                                                var board = response.data.filter(el => el.name === phrase[1])[0];
                                                return attachWebhook(pipe, board.id, webHooks,board.name, data.channel,tokenUser);
                                            } 
                                        }).catch((err) => {
                                            skill.log("Error : "+err);
                                            return send("Une erreur est survenue en contactant l'API de trello "+err,"Error",true);
                                        });
                                    } else {
                                        return attachWebhook(pipe, keyTab.filter(el => el.userName === data.userName)[0].idMember, webHooks, data.userName, data.channel,tokenUser);
                                    }
                                });
                            }
                        });
                    case "detach":
                        return skill.getItem('webHooks').then((webHooks) => {
                            if(!webHooks) webHooks = [];
                            var nameModel = phrase[1];
                            if(phrase[1] === "me") nameModel = data.userName;
                            if(webHooks.filter(val => val.channel === data.channel && val.nameModel === nameModel).length > 0) {
                                var webHook = webHooks.filter(val => val.channel === data.channel && val.nameModel === nameModel)[0];
                                skill.log(webHook);
                                return axios({
                                    url: apiTrelloUrl + `/webhooks/${webHook.id}/?key=${API_KEY}&token=${tokenUser}`,
                                    method: "delete"
                                }).then((response) => {
                                    webHooks.splice(webHooks.findIndex(val => val.id === webHook.id),1);
                                    skill.log(webHooks);
                                    return skill.storeItem('webHooks',webHooks).then(() => {
                                        skill.useHook(webHook.hookID,{ message: {text: "Webhook attaché à ce channel supprimé !"}}, { deleteHook: true });
                                        return send("Plus de webhook à "+nameModel+" dans ce channel, you can add a new with `!trello attach [nameBoard|me]`");
                                    });
                                }).catch((err) => {
                                    return send("Erreur en contactant l'API trello : " + err,"Error");
                                });
                            } else {
                                return send("No webHook attached to this channel with this name : "+phrase[1]);
                            }
                        });
                    case "list":
                        return skill.getItem('webHooks').then((webHooks) => {
                            webHooks = webHooks.filter(el => el.channel === data.channel);
                            var text = "";
                            if( webHooks.length === 0) {
                                return send("Pas de webhook dans ce channel","Webhook associé au channel "+data.channel);
                            } else {
                                webHooks.map((webHook) => {
                                    text += " - ID : "+webHook.id+ ", nom du modèle associé (ou userName associé) : "+webHook.nameModel+"\n"; 
                                });
                                return send(text,"Webhook associé au channel "+data.channel);
                                }
                        });
                    default:
                        return send("Je n'ai pas compris votre demande ! type `!trello help` to get the help for trello");
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
    }, {
        description: "Commande pour afficher vos boards trello, et créer des webhook qui vous envoie des messages quand un élément est modifié",
        "subcommands":[
            {
                "name":"get-boards",
                "cmd":"boards",
                "description":"Renvoie vos boards trello"
            },
            {
                "name":"attach",
                "cmd":"attach",
                "description":"Attache un webhook trello à ce channel soit sur un board trello soit sur vous même",
                "parameters":[
                    {
                        "position":0,
                        "name":"BoardName",
                        "description":"Nom du board sur lequel vous voulez mettre un webhook",
                        "example":"arachne"
                    },
                    {
                        "position":1,
                        "name":"me",
                        "description":"Pour attacher un webhook trello à votre id"
                    }
                ],
                "examples":[
                    {
                        "phrase":"attach arachne",
                        "action":"attache un webhook au board arachne"
                    },
                    {
                        "phrase":"attach me",
                        "action":"attache un webhook à votre id"
                    }
                ]
            },
            {
                "name":"detach",
                "cmd":"detach",
                "description":"détache le webhook trello de ce channel sur un board trello ou à vous même",
                "parameters":[
                    {
                        "position":0,
                        "name":"BoardName",
                        "description":"Nom du board sur lequel vous voulez détacher le webhook",
                        "example":"arachne"
                    },
                    {
                        "position":1,
                        "name":"me",
                        "description":"Pour détacher le webhook trello à votre id"
                    }
                ],
                "examples":[
                    {
                        "phrase":"detach arachne",
                        "action":"detache le webhook du board arachne"
                    },
                    {
                        "phrase":"detach me",
                        "action":"detache le webhook avec votre id"
                    }
                ]
            },{
                "name":"list",
                "cmd":"list",
                "description":"liste les webhooks associé au canal courant"
            }
        ]
    });
    
}