/*
  SKILL : events
  AUTHOR : Anonymous
  DATE : 30/04/2018
*/

module.exports = (skill) => {
    
    var axios = skill.loadModule('axios');
    var actIntechEndPoint = "https://act.intech.lu/actintech/v1";
    var actIntechFront = "https://act.intech.lu";
    
    function distance(a, b){
      if(a.length === 0) return b.length; 
      if(b.length === 0) return a.length; 
      var matrix = [];
      var i;
      for(i = 0; i <= b.length; i++){
        matrix[i] = [i];
      }
      var j;
      for(j = 0; j <= a.length; j++){
        matrix[0][j] = j;
      }
      for(i = 1; i <= b.length; i++){
        for(j = 1; j <= a.length; j++){
          if(b.charAt(i-1) == a.charAt(j-1)){
            matrix[i][j] = matrix[i-1][j-1];
          } else {
            matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
          }
        }
      }
      return matrix[b.length][a.length];
    }
    
    function distance2(a, b) {
        var result = 100;
        var d;
        var tabA = a.split(" ");
        var tabB = b.split(" ");
        for(var i = 0 ;i < tabA.length; i++) {
            for(var j = 0 ;j < tabB.length; j++) {
                d = distance(tabA[i],tabB[j]);
                if(result > d) result = d;
            }
        }
        return result;
    }
    
    function searchEvents(query, results) {
        return new Promise((resolve, reject) => {
            results.map((result) => {
                result.sim = distance2(query.toLowerCase(), result.description.toLowerCase());
            });
            results.sort((a,b) => { return a.sim - b.sim });
            return resolve(results[0]);
        });
    }
    
    function printEvent(event, soon = false) {
        var messages = "";
        var options = {year: 'numeric',month: 'long',day: 'numeric',hour: 'numeric',minute: 'numeric'};
        //Get the organizers
        messages += " *Titre* " + event.description + "\n";
        messages += " *Résumé* " + event.summary + "\n";
        let organizers = '';
        if (event.organizers && event.organizers.length > 0) {
            organizers += event.organizers[0].firstName + ' ' + event.organizers[0].lastName;
            for (let j = 1; j < event.organizers.length; j++) {
                organizers += ', ' + event.organizers[j].firstName + ' ' + event.organizers[j].lastName;
            }
        }
        // Print the organizers
        messages += ' *Organisé par* : ' + organizers + "\n";
        messages += ' *Date* : ' + Intl.DateTimeFormat('EN', options).format(new Date(event.dateTime)) + "\n";
        messages += ' *Localisation* : ' + event.place.formatted_address + "\n"; // jshint ignore:line
        let seatPluriel = '';
        //Get the number of seats and pint them
        if ((event.nbSeat - event.nbRegistersAccepted) > 1) {
            seatPluriel = 's';
        }
        if (event.nbSeat >= 0) {
            messages += ' *Nombre de places* : ' + event.nbSeat + ' places dont ' + (event.nbSeat - event.nbRegistersAccepted) + ' place' + seatPluriel + ' restante' + seatPluriel + "\n";
        } else {
            messages += ' *Nombre de places* : illimité' + "\n";
        }
        var image_url = null;
        if(event.picture) {
            image_url = event.picture;
        }
        // Print the date of the begining of the subscription
        messages += ' *Début des inscriptions* : ' + Intl.DateTimeFormat('EN', options).format(new Date(event.registrationDateStart)) + "\n";
        // Print the end
        messages += ' *Fin des inscriptions* : ' + Intl.DateTimeFormat('EN', options).format(new Date(event.registerDeadline)) + "\n" + "\n";
    
        messages += ` Plus d'informations et inscription à ce lien : [Lien](${actIntechFront + '/activity/' + event._id})` + "\n";
        return ({ text: messages, image_url});
    }
    
    function getEvents(token) {
        return new Promise((resolve, reject) => {
            // Build the endpoint to have the actives activities
            let endPoint = actIntechEndPoint + '/activities?state=actif';
            skill.log(endPoint);
            // Do an http get call with the token ( store in res ) in the header
            var options = {
                url: encodeURI(endPoint),
                headers: {
                    'Authorization': token,
                    'Accept': 'application/json',
                    'user-agent': 'node-request'
                }
            };
            // Build the request using request package
            axios(options).then((response) => {
                return resolve(response.data);
            }).catch((err) => {
                if(err.response.status === 404) {
                    return reject("Je n'ai pas trouvé d'events :( ");
                } else {
                    return reject("Erreur d'appel au backend de ActIntech :( " + err.response.status);
                }
            });
        });
    }
    
    skill.addCommand("events","events",({ phrase, data }) => {
      return Promise.resolve().then(() => {
        // Retrieve the parameter that the user sent with the !events command
        var query = phrase.trim().replace('events', '').trim();
        // if there is no query, associate it to soon
        if (query === '') {
          query = 'all';
        }
        skill.log("Retreiving token ... ");
        // retrieve the ad token 
        return skill.execute('getToken').then((response) => {
            const token = response.response.token;
            switch (query) {
                case '':
                    // All case
                    // Retrieve all the events
                    skill.log("Retreiving all events");
                    return getEvents(token).then((results) => {
                        // Retrieve the informations well printed
                        var attachments = [];
                        skill.log(results[0]);
                        for (var i = 0; i < results.length; i++) {
                            attachments.push(printEvent(results[i], true));
                        }
                        skill.log("Printing events");
                        return ({
                            message: {
                                title: "Liste des prochains Evenements",
                                attachments: attachments
                            }
                        });
                    });
            case 'help':
            // Help block
            return ({
                message: {
                    title: "Events à venir : ",
                    text: " HELP pour la commande events \n" + "\n"
                     +" Cette commande permet d'obtenir la liste des événements à venir sur ActIntech. \n"
                     + " Paramètres eventuels de la query : \n"
                     + " *soon* , exemple : !events soon , permet d'obtenir la liste des événements ActIntech dans le mois prochain. \n"
                     + " *all* , exemple : !events all , permet d'obtenir la liste entière des événements à venir sur ActIntech. \n"
                     + " *[query]* , exemple : !events karting, permet d'obtenir une liste des évenements en rapport avec une query. \n"
                }
            });
            default:
                // The query block ie it will search trough the name of the events for the event that is the most related with what the user entered.
                // Retrieve the events
                skill.log("Retreiving all events");
                return getEvents(token).then((results) => {
                    // Search for the event in the events
                    skill.log("Search for events with query "+query);
                    return searchEvents(query, results).then((resultSearch) => {
                        // Else print it
                        skill.log("Find event");
                        var attachments = [printEvent(resultSearch)];
                        var message = {
                            title: "Evenements lié à "+query,
                            attachments: attachments
                        };
                        return({
                            message: message
                        });
                    });
                });
            }
        });
      }).catch((err) => {
            if (typeof(err) !== String) err = err.toString();
            skill.log("Error : " + err);
            return({
                message: {
                    title: "Error",
                    text: err
                }
            }); 
      });
    }, {
        description: "Permet de récupérer les événements de ActIntech",
        "subcommands":[
            {
                "name":"get-events",
                "cmd":"",
                "description":"Renvoie les events en fonction du paramètre entrée",
                "parameters":[
                    {
                        "position":0,
                        "name":"eventSearch",
                        "description":"(optionel) pour rechercher les events avec un critère de recherche, sans paramètres, cela renvoie tous les événements actifs",
                        "example":"disney"
                    }
                ],
                "examples":[
                    {
                        "phrase":"events disney",
                        "action":"Cherche les events avec le mot clé disney"
                    },
                    {
                        "phrase":"events",
                        "action":"renvoie tous les events actifs d'actIntech"
                    }
                ]
            }
        ]
    });

    skill.addIntent("events","events",({ entities = {}, data }) => {
        return skill.handleCommand("events",{phrase: "events all", data});
    },{
        description: "Donne des informations sur les events ActIntech",
        examples: [
            {
                action: "",
                phrases: [
                    "Prochains évents ?",
                    "Affiche les évènements à venir",
                    "Quels sont les prochains évènements ?"
                ]
            }]
    });
/* </SKILL LOGIC> */
};