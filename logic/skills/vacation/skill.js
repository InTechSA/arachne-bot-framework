/*
  SKILL : vacation
  AUTHOR : Anonymous
  DATE : 11/04/2018
*/

module.exports = (skill) => {
    
    var axios = skill.loadModule('axios');
    var url_vac_micro = "http://bot-vacation.intech-lab.com";
    
    /**
     * Phrases for the conversation between the bot and the user for the vacation request
     */
    const conversationTexts = ["Début de la demande de congés automatisée : \n" + "\n" + "Je vais maintenant vous posez des questions pour compléter votre demande de congés.\n" + "  \n" +
      "Vous pouvez taper Abort pour annuler la demande à toute étape. \n" + "  \n" +
      "Veuillez commencer par entrer la date de début et de fin de la période de congés souhaités, séparés par un espace dans le format DD/MM/YYYY\n" +
      "Exemple de réponse : 05/09/2018 15/09/2018",
    "Veuillez maintenant entrer le/les trigrammes de votre/vos manager(s), ceux ci devront être séparé par un espace\n" + "Exemple de réponse : RCR , autre exemple : RCR GTO JLX ",
      "J'ai toutes les informations qu'il me faut ! Voici les informations que j'ai : ",
      "Entrez Ok pour valider les informations et réaliser la demande, Abort pour annuler votre demande"
    ];
    
    /**
     * 
     * @param { phrase (String, data(Object))} param0 the informations sent by the adapter, phrase : the complete phrase sent by the user containing !vacation 
     * THe object data contains informations sent by the adapter 
     */
    skill.addCommand("vacation","vacation",({ phrase, data }) => {
      return Promise.resolve().then(() => {
        // Retrieve the action from the phrase entered by the user
        var action = phrase.trim().replace('vacation', '').trim();
        // Retrieve the usrname from the data of the brain ( sent by the adapter )
        var query = null;
        if(data.userName) {
          query = data.userName;
        }
        else {
          return ({message: {text: "Vous n'avez pas d'userName :thinking: "}});
        }
        // Build the return message
        // Depend on the action entered by the user
        switch (action) {
            case 'request':
                // If it's a request, test first if the person sent the message in a public channel
                if (!data.privateChannel) {
                    return({
                        message: {
                            text: "Vos demandes doivent être fait dans un canal privée !\n" +
                            "Veuillez réitérer votre demande de congée ici :)",
                            private: true
                        }
                    });
                }
                // If not create a thread to initiate the vacation request thread ( used to build a conversation between the user and the bot )
                // Then return the first message of the conversation with the thread_id created, in interactive mode and in a private channel
                return({
                    message: {
                      interactive: true,
                      thread: {
                          timestamp: new Date(),
                          source: query + ' ' + data.userName,
                          data: [
                            ["userName", data.userName],
                            ["step", 0]
                          ],
                          handler: "thread-vacation-handler",
                          duration: 59,
                          timeout_message: "Votre demande de congée a expirée, veuillez la réitérez"
                      },
                      text: conversationTexts[0],
                      private: true
                    }
                  });
            case 'status':
                // It's the code to retrieve the status associated to the vacation request of the user.
                skill.log("Retreiving token ... ");
                // First retrieve the ad-token using the get-ad-token method
                return skill.execute('getToken').then((response) => {
                    skill.log("Retrieve Token");
                    // call the vacation microservice on the getStatus route
                    var url = url_vac_micro + "/getStatus/" + query;
                    skill.log(url);
                    // Build the request
                    var options = {
                        url: encodeURI(url),
                        headers: {
                            'Authorization': 'Bearer ' + response.response.token,
                            'Accept': 'application/json'
                        },
                        timeout: 5000
                    };
                    // Do the request using request
                    return axios(options).then((response) => {
                        var message = response.data;
                        message.private = true;
                        return({message});
                    }).catch((err) => {
                        err.axios = "Une erreur est survenue en contactant le micro service vacation :(";
                        throw err;
                    });
                }).catch((err) => {
                    if(err.axios) throw err.axios;
                    throw "Je n'ai pas pu récupérer le token de l'AD :(";
                });
            default:
                // default part ie retrieve the vacation for the user
                skill.log("Retreiving token ... ");
                return skill.execute('getToken').then((response) => {
                    // Retrieve the ad-token
                    skill.log("Retrieve Token");
                    // Build the url to retrieve info from the vacation microservice api
                    var url = url_vac_micro + "/leaves/" + query;
                    skill.log(url);
                    // Build the request
                    var options = {
                        url: encodeURI(url),
                        headers: {
                            'Authorization': 'Bearer ' + response.response.token,
                            'Accept': 'application/json'
                        },
                        timeout: 10000
                    };
                    // Make the request
                    return axios(options).then((response) => {
                        // Error
                        var message = response.data;
                        message.private = true;
                        return ({
                            message
                        });
                    }).catch((err) => {
                        if(err.response.status === 404) {
                            return ({
                                message: {
                                    private: true,
                                    title: "Pas de congés !",
                                    text: "Je n'ai pas trouvé de congés pour vous"
                                }
                            });
                        } else {
                            return ({
                                message: {
                                    private:true,
                                    title: "Error",
                                    text: "Une erreur est survenue en contactant le microservice vacation :("
                                }
                            });
                        }
                    });
                }).catch((error) => {
                    throw "Je n'ai pas pu récupérer le token de l'AD :(";
                });
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
        description: "Command to get your vacation or made a request for vacations"
    });
    
    /**
     * 
     * @param {String} thread the thread object that is associated with the conversation for the vacation request, each thread id is associated to a user and contain informations
     * About this user
     * @param {phrase (String)} param1 the phrase sent by the user for this thread 
     */
    skill.addInteraction("thread-vacation-handler", (thread, { phrase }) => {
        return Promise.resolve().then(() => {
            if (['Abort','abort','annuler','cancel','arrete','arrête','stop'].includes(phrase)){
                // If the user sent an Abort, will shutdown the thread and close the vacation request
                skill.log("borting the demand");
                // Return the associated message
                return ({
                    message: {
                        text: `La demande de congés a été annulée. Vous pouvez refaire une demande en tapant !vacation request !`,
                        private: true
                    }
                });
            } else {
                // If the entered something different from Abort 
                skill.log("Retreiving token ... ");
                // Retrieve the ad-token 
                return skill.execute('getToken').then((responseToken) => {
                    var tokenAD = responseToken.response.token;
                    skill.log("Retrieved Token");
                    // Retrieve the userName from the the thread daat
                    var userName = thread.getData("userName");
                    var urlRequest = null;
                    var options = null;
                    // retrieve the step from the thread data ie where the user is in the vacation request process.
                    var step = thread.getData("step");
                    skill.log("Step : " + step);
                    // Will execute different blocks depending on the value of step
                    switch (step) {
                        case 0:
                            // Step 0, ask for dates to initiate the request
                            // Retrieve the dates from phrase
                            var dates = phrase.trim().replace('vacation', '').split(' ');
                            // Check if there is 2 dates
                            if (dates.length !== 2) {
                                // If not return the appropriate message and stay at step 0 ( waiting for valid dates )
                                return ({
                                    message: {
                                        interactive: true,
                                        text: "Veuillez renseigner DEUX dates !! La première pour le début de votre période de congés, la deuxième pour la fin.",
                                        private: true
                                    }
                                });
                            } else {
                                // Else will contact the vacation micro to verif the Dates ( if they are valid, if the user have suffisient days of vacations etc)
                                urlRequest = url_vac_micro + "/verifDates/?start=" + dates[0] + "&end=" + dates[1] + "&user=" + userName;
                                // Build the request
                                options = {
                                    url: encodeURI(urlRequest),
                                    headers: {
                                        'Authorization': 'Bearer ' + tokenAD,
                                        'Accept': 'application/json'
                                    },
                                    timeout: 10000
                                };
                                // Make the request using request
                                return axios(options).then((response) => {
                                    // Else will store the dates, the trigram returned, and build the message return ( with the text message retrieved from the api and the next element in the conversationtext string );
                                    skill.log("No error, returning the success message and the next question");
                                    thread.setData("dateDebut", dates[0]);
                                    thread.setData("dateFin", dates[1]);
                                    thread.setData("trigram", response.data.trigram);
                                    // Increase the step to go to the next step
                                    thread.setData("step", 1);
                                    messageReturn = response.data.text + "  \n" + "  \n";
                                    messageReturn += conversationTexts[1];
                                    // return the message
                                    skill.log("Returning the message : " + messageReturn);
                                    return({
                                        message: {
                                            interactive: true,
                                            text: messageReturn,
                                            private: true
                                        }
                                    });
                                }).catch((err) => {
                                    if(err.response.data.text) {
                                        throw err.response.data.text;
                                    } else {
                                        throw "Error contacting the vacation microservice";   
                                    }
                                });
                            }
                            break;
                        case 1:
                            // Step 1 , waiting for the manager's trigrams of the user
                            var trigrams_manager = phrase.trim().replace('vacation', '').split(' ');
                            for (var i = 0; i < trigrams_manager.length; i++) {
                                // Check if the trigrams are of size 3 before sending to the api
                                if (trigrams_manager[i].length !== 3) {
                                    //If not return the appropriate message
                                    return({
                                        message: {
                                            interactive: true,
                                            text: "Les trigrammes doivent être composé de 3 caractères seulement ! Veuillez rentrez des/un trigramme(s) valide(s) ! ",
                                            private: true
                                        }
                                    });
                                }
                                // Check if the person doesn't put himself as manager
                                /*if (trigrams_manager[i] === thread.getData("trigram")) {
                                    // Return the appropriate message
                                    return({
                                        message: {
                                            interactive: true,
                                            text: "Vous ne pouvez pas vous mettre vous même en tant que manager !! Veuillez réitérer votre demande. ",
                                            private: true
                                        }
                                    });
                                }*/
                            }
                            // Build the url to the vacation micro
                            urlRequest = url_vac_micro + "/verifManager/" + trigrams_manager.join(',');
                            skill.log(urlRequest);
                            // BUild the request
                            options = {
                                url: encodeURI(urlRequest),
                                headers: {
                                    'Authorization': 'Bearer ' + tokenAD,
                                    'Accept': 'application/json'
                                },
                                timeout: 10000
                            };
                            // Do the request using request
                            return axios(options).then((response) => {
                                // All the managers are valid, we retrieve all the informations about them
                                var managers = response.data;
                                skill.log("No error, returning the success message and the next question");
                                // We store the manager in the thread datas
                                thread.setData("managers", managers);
                                // We go to the next step
                                thread.setData("step", 2);
                                // build the return message
                                var messageReturn = "Vos managers sont valides et ont étés enregistrés !" + " \n" + " \n";
                                messageReturn += conversationTexts[2] + "\n" + " \n";
                                messageReturn += "Date de début demandé : " + thread.getData("dateDebut") + "\n";
                                messageReturn += "Date de fin demandé : " + thread.getData("dateFin") + "\n";
                                messageReturn += "Managers renseignés : " + "\n";
                                for (var i = 0; i < managers.length; i++) {
                                  messageReturn += "Trigramme " + managers[i].trigram + " , Nom complet " + managers[i].displayName + " , Email " + managers[i].email + "\n";
                                }
                                messageReturn += "  \n";
                                messageReturn += conversationTexts[3] + "\n";
                                skill.log("Returning the message : " + messageReturn);
                                return({
                                    message: {
                                        interactive: true,
                                        text: messageReturn,
                                        private: true
                                    }
                                });
                            }).catch((err) => {
                                if(err.response.data.text) {
                                    throw err.response.data.text;
                                } else {
                                    throw "Error contacting the vacation microservice";   
                                }
                            });
                        case 2:
                            // Step 2, for the confirmation of the request, wait for the user to confirm the informations the bot have
                            if (["Ok","ok","o","oui","yes"].includes(phrase)) {
                                // The user confirms, build the url for the vacation micro with all the informations needed
                                urlRequest = url_vac_micro + "/confirmDemande/?dateDebut=" + thread.getData("dateDebut") +
                                    "&dateFin=" + thread.getData("dateFin") +
                                    "&managers=" + JSON.stringify(thread.getData("managers")) +
                                    "&trigram=" + thread.getData("trigram") +
                                    "&userName=" + thread.getData("userName");
                                skill.log(urlRequest);
                                // Build the request
                                options = {
                                    url: encodeURI(urlRequest),
                                    headers: {
                                      'Authorization': 'Bearer ' + tokenAD,
                                      'Accept': 'application/json'
                                    },
                                    timeout: 10000
                                };
                                // Make the request using request
                                return axios(options).then((response) => {
                                    // Return the last message for the conversation for the vacation request
                                    // Close the thread
                                    return({
                                        message: {
                                            text: "Votre demande a été transmise à vos/votre manager(s), vous pouvez voir son statut en tapant : !vacation status.\n" + "\n" + "Une fois que tous vos managers " +
                                        "ont validés votre demande, un mail sera envoyé à Carine et vous serez en copie de ce mail.\n" + "\n" + "Si un de vos managers refuse votre demande, il vous sera envoyé un mail avec les raisons de son refus.",
                                            private: true
                                        }
                                    });
                                }).catch((err) => {
                                    if(err.response.data.text) {
                                        throw err.response.data.text;
                                    } else {
                                        throw "Error contacting the vacation microservice";   
                                    }
                                });
                            } else {
                                // Phrase wasn't Ok or Abort, send this message
                                return({
                                    message: {
                                        interactive: true,
                                        text: "Je n'ai pas compris, veuillez répondre par Ok pour confirmer ou Abort pour annuler.",
                                        private: true
                                    }
                                });
                            }
                            break;
                        default:
                            // Normally will never enter this block but it's a security concerning the switch
                            throw "Une erreur inconnue s'est produite :(";
                    }
                }).catch((error) => {
                    throw "Une erreur s'est produite en récupérant le token de l'AD";
                });
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
}