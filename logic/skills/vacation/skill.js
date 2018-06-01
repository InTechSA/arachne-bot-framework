/*
  SKILL : vacation
  AUTHOR : Anonymous
  DATE : 11/04/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/
// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'vacation': {
    cmd: "vacation",
    execute: vacationHandler
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
};
/* </SKILL INTENTS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ["request"];
/* </SKILL DEPENDENCIES> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
  'thread-vacation-handler': {
    name: "thread-vacation-handler",
    interact: vacationResponseHandler
  }
};
/* </SKILL INTERACTIONS> */

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
var request = require('request');
var url_vac_micro = process.env.VACATION_URL_MICROSERVICE || "http://192.168.6.53:8001";
/**
  Handler for command vacation (!vacation).

  Params :
  --------
    phrase: String
*/
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
function vacationHandler({ phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    // Retrieve the action from the phrase entered by the user
    var action = phrase.trim().replace('vacation', '').trim();
    // Retrieve the usrname from the data of the brain ( sent by the adapter )
    if(data.userName) {
      var query = data.userName;
    }
    else {
      return resolve({message: {text: "No data in the message, can't process vacation command :("}});
    }
    // Build the return message
    var message = {};
    // Depend on the action entered by the user
    switch (action) {
      case 'request':
        // If it's a request, test first if the person sent the message in a public channel
        if (!data.privateChannel) {
          console.log("Test : " + data.channel);
          return resolve({
            message: {
              title: "Cannot send first message",
              text: "Vos demandes doivent être fait dans un canal privée !\n" +
                "Veuillez réitérer votre demande de congée ici :)",
              private: true
            }
          });
        }
        // If not create a thread to initiate the vacation request thread ( used to build a conversation between the user and the bot )
          // Then return the first message of the conversation with the thread_id created, in interactive mode and in a private channel
          return resolve({
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
        console.log("Retreiving token ... ");
        // First retrieve the ad-token using the get-ad-token method
        overseer.handleCommand('get-ad-token').then((response) => {
          console.log("Retrieve Token");
          // call the vacation microservice on the getStatus route
          var url = url_vac_micro + "/getStatus/" + query;
          console.log(url);
          // Build the request
          var options = {
            url: encodeURI(url),
            headers: {
              'Authorization': 'Bearer ' + response.response.token,
              'Accept': 'application/json'
            }
          };
          // Do the request using request
          request(options, (err, res, body) => {
            if (err || res.statusCode !== 200) {
              // Error
              if (!body) {
                message.text = "Error contacting the vacation service :(";
              } else {
                message = JSON.parse(body);
              }
              console.log('Error contacting the service or error in the service');
            } else {
              // Else we retrieve the message sent by the microservice
              message = JSON.parse(body);
            }
            message.private = true;
            return resolve({
              success: true,
              message: message
            });
          });
        }).catch((error) => {
          console.log("Catch error in command get-ad-token " + error);
          // Handle the error of get-ad-token
          message.private = true;
          message.text = "Error retrieiving the token from the ad";
          return resolve({
            success: false,
            message: message
          });
        });
        break;
      default:
        // default part ie retrieve the vacation for the user
        console.log("Retreiving token ... ");
        overseer.handleCommand('get-ad-token').then((response) => {
          // Retrieve the ad-token
          console.log("Retrieve Token");
          // Build the url to retrieve info from the vacation microservice api
          var url = url_vac_micro + "/leaves/" + query;
          console.log(url);
          // Build the request
          var options = {
            url: encodeURI(url),
            headers: {
              'Authorization': 'Bearer ' + response.response.token,
              'Accept': 'application/json'
            }
          };
          // Make the request
          request(options, (err, res, body) => {
            if (err || res.statusCode !== 200) {
              // Error
              if (!body) {
                message.text = "Error contacting the vacation service :(";
              } else {
                 message = JSON.parse(body);
              }
              console.log('Error contacting the service or error in the service');
            } else {
              // Else we retrieve the message sent by the microservice
              message = JSON.parse(body);
            }
            message.private = true;
            return resolve({
              success: true,
              message: message
            });
          });
        }).catch((error) => {
          console.log("Catch error in command get-ad-token " + error);
          /* Handle the error of this command here */
          message.private = true;
          message.text = "Error retrieiving the token from the ad";
          return resolve({
            success: false,
            message: message
          });
        });
        break;
    }
  });
}

/**
 * 
 * @param {String} thread the thread object that is associated with the conversation for the vacation request, each thread id is associated to a user and contain informations
 * About this user
 * @param {phrase (String)} param1 the phrase sent by the user for this thread 
 */
function vacationResponseHandler(thread, { phrase }) {
  return new Promise((resolve, reject) => {
    if (phrase === 'Abort') {
      // If the user sent an Abort, will shutdown the thread and close the vacation request
      console.log("Aborting the demand");
        // Return the associated message
        return resolve({
          message: {
            text: `La demande de congés a été annulée. Vous pouvez refaire une demande en tapant !vacation request !`,
            private: true
          }
        });
    } else {
      // If the entered something different from Abort 
      console.log("Retreiving token ... ");
      // Retrieve the ad-token 
      overseer.handleCommand('get-ad-token').then((responseToken) => {
        var tokenAD = responseToken.response.token;
        console.log("Retrieved Token");
        // Retrieve the userName from the the thread daat
        var userName = thread.getData("userName");
        var messageReturn = "";
        var urlRequest = null;
        // retrieve the step from the thread data ie where the user is in the vacation request process.
        var step = thread.getData("step");
        console.log("Step : " + step);
        // Will execute different blocks depending on the value of step
        var options;
        switch (step) {
          case 0:
            // Step 0, ask for dates to initiate the request
            // Retrieve the dates from phrase
            var dates = phrase.trim().replace('vacation', '').split(' ');
            // Check if there is 2 dates
            if (dates.length !== 2) {
              // If not return the appropriate message and stay at step 0 ( waiting for valid dates )
              messageReturn = "Veuillez renseigner DEUX dates !! La première pour le début de votre période de congés, la deuxième pour la fin.";
              return resolve({
                success: true,
                message: {
                  interactive: true,
                  text: messageReturn,
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
                }
              };
              // Make the request using request
              request(options, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                  // Error it can be if a date is malformed, the person have insuffisient days of vacations remaining , the dates did not respect the order etc
                  if (body) {
                    console.log("Error, returning the body " + body);
                    messageReturn = body;
                  } else {
                    console.log("Error, no body");
                    messageReturn = "Une erreur s'est produite en contactant l'api Vacation :( ";
                  }
                }
                else {
                  // Else will store the dates, the trigram returned, and build the message return ( with the text message retrieved from the api and the next element in the conversationtext string );
                  console.log("No error, returning the success message and the next question");
                  thread.setData("dateDebut", dates[0]);
                  thread.setData("dateFin", dates[1]);
                  thread.setData("trigram", JSON.parse(body).trigram);
                  // Increase the step to go to the next step
                  thread.setData("step", 1)
                  messageReturn = JSON.parse(body).text + "  \n" + "  \n";
                  messageReturn += conversationTexts[1];
                }
                // return the message
                console.log("Returning the message : " + messageReturn);
                return resolve({
                  success: true,
                  message: {
                    interactive: true,
                    text: messageReturn,
                    private: true
                  }
                });
              });
            }
            break;
          case 1:
            // Step 1 , waiting for the manager's trigrams of the user
            var trigrams_manager = phrase.trim().replace('vacation', '').split(' ');
            // Check if the trigrams are of size 3 before sending to the api
            for (var i = 0; i < trigrams_manager.length; i++) {
              if (trigrams_manager[i].length !== 3) {
                //If not return the appropriate message
                messageReturn = "Les trigrammes doivent être composé de 3 caractères seulement ! Veuillez rentrez des/un trigramme(s) valide(s) ! ";
                return resolve({
                  success: true,
                  message: {
                    interactive: true,
                    text: messageReturn,
                    private: true
                  }
                });
              }
              // Check if the person doesn't put himself as manager
              if (trigrams_manager[i] === thread.getData("trigram")) {
                // Return the appropriate message
                messageReturn = "Vous ne pouvez pas vous mettre vous même en tant que manager !! Veuillez réitérer votre demande. ";
                return resolve({
                  success: true,
                  message: {
                    interactive: true,
                    text: messageReturn,
                    private: true
                  }
                });
              }
            }
            // Build the url to the vacation micro
            urlRequest = url_vac_micro + "/verifManager/" + trigrams_manager.join(',');
            console.log(urlRequest);
            // BUild the request
            options = {
              url: encodeURI(urlRequest),
              headers: {
                'Authorization': 'Bearer ' + tokenAD,
                'Accept': 'application/json'
              }
            };
            // Do the request using request
            request(options, (err, res, body) => {
              if (err || res.statusCode !== 200) {
                // Error, can be if the managers doesn't exist
                if (body) {
                  console.log("Error, returning the body " + body);
                  messageReturn = body;
                } else {
                  console.log("Error, no body");
                  messageReturn = "Une erreur s'est produite en contactant l'api Vacation :( ";
                }
              }
              else {
                // All the managers are valid, we retrieve all the informations about them
                var managers = JSON.parse(body);
                console.log("No error, returning the success message and the next question");
                // We store the manager in the thread datas
                thread.setData("managers", managers);
                // We go to the next step
                thread.setData("step", 2);
                // build the return message
                messageReturn = "Vos managers sont valides et ont étés enregistrés !" + " \n" + " \n";
                messageReturn += conversationTexts[2] + "\n" + " \n";
                messageReturn += "Date de début demandé : " + thread.getData("dateDebut") + "\n";
                messageReturn += "Date de fin demandé : " + thread.getData("dateFin") + "\n";
                messageReturn += "Managers renseignés : " + "\n";
                for (var i = 0; i < managers.length; i++) {
                  messageReturn += "Trigramme " + managers[i].trigram + " , Nom complet " + managers[i].displayName + " , Email " + managers[i].email + "\n";
                }
                messageReturn += "  \n";
                messageReturn += conversationTexts[3] + "\n";
              }
              console.log("Returning the message : " + messageReturn);
              return resolve({
                success: true,
                message: {
                  interactive: true,
                  text: messageReturn,
                  private: true
                }
              });
            });
            break;
          case 2:
            // Step 2, for the confirmation of the request, wait for the user to confirm the informations the bot have
            if (phrase === "Ok") {
              // The user confirms, build the url for the vacation micro with all the informations needed
              urlRequest = url_vac_micro + "/confirmDemande/?dateDebut=" + thread.getData("dateDebut") +
                "&dateFin=" + thread.getData("dateFin") +
                "&managers=" + JSON.stringify(thread.getData("managers")) +
                "&trigram=" + thread.getData("trigram") +
                "&userName=" + thread.getData("userName");
              console.log(urlRequest);
              // Build the request
              options = {
                url: encodeURI(urlRequest),
                headers: {
                  'Authorization': 'Bearer ' + tokenAD,
                  'Accept': 'application/json'
                }
              };
              // Make the request using request
              request(options, (err, res, body) => {
                if (err || res.statusCode !== 200) {
                  // Eventual error ( can be during the execution of the confirm process ( inserting in the DB, sending the mails etc ))
                  if (body) {
                    console.log("Error, returning the body " + body);
                    messageReturn = body;
                  } else {
                    console.log("Error, no body");
                    messageReturn = "Une erreur s'est produite en contactant l'api Vacation :( ";
                  }
                  // Return the error
                  return resolve({
                    message: {
                      interactive: true,
                      text: messageReturn,
                      private: true
                    }
                  });
                }
                else {
                  // Return the last message for the conversation for the vacation request
                  messageReturn = "Votre demande a été transmise à vos/votre manager(s), vous pouvez voir son statut en tapant : !vacation status.\n" + "\n" + "Une fois que tous vos managers " +
                    "ont validés votre demande, un mail sera envoyé à Carine et vous serez en copie de ce mail.\n" + "\n" + "Si un de vos managers refuse votre demande, il vous sera envoyé un mail avec les raisons de son refus.";
                  // Close the thread
                    return resolve({
                      message: {
                        text: messageReturn,
                        private: true
                      }
                    });
                }
              });

            } else {
              // Phrase wasn't Ok or Abort, send this message
              messageReturn = "Je n'ai pas compris, veuillez répondre par Ok pour confirmer ou Abort pour annuler.";
              return resolve({
                success: true,
                message: {
                  interactive: true,
                  text: messageReturn,
                  private: true
                }
              });
            }
            break;
          default:
            // Normally will never enter this block but it's a security concerning the switch
            messageReturn = " Une erreur inconnue s'est produite :/ ";
            console.log("Returning the message : " + messageReturn);
            return resolve({
              success: true,
              message: {
                interactive: true,
                text: messageReturn,
                private: true
              }
            });
        }
      }).catch((error) => {
        console.log("Catch error in command get-ad-token " + error);
        /* Handle the error of this command here */
        return resolve({
          success: false,
          message: { text: "Couldn't get the ad-token , maybe something is wrong with the AD ? :/", private: true }
        });
      });
    }
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.