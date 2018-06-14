/*
  SKILL : help
  AUTHOR : Anonymous
  DATE : 07/05/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'help': {
    cmd: "help",
    execute: handlerHelp
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = [];
/* </SKILL DEPENDENCIES> */

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


/**
  Handler for command help (!help).

  Params :
  --------
    phrase: String
*/

/**
 * @param {phrase (String), data (object)} param0 the object with the prase entered by the user containing the !help and the data sent by the adapter
 */
function handlerHelp({ phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
   // Build the help
    var buildHelp = "Voici la liste des commandes disponibles : \n";
    buildHelp += "- `!bus` *→* Donne les horaires des prochains bus passant à l'agence.\n";
    buildHelp += "- `!events soon|all|[query]` *→* affiche les évenements d'ActIntech prochainement | tous | d'après une recherche.\n";
    buildHelp += "- `!itinary [dest1] [dest2]` *→* affiche un itinéraire d'une destination 1 à une destination 2. Si la destination 2 est absente, fais un départ de l'agence.\n";
    buildHelp += "- `!quizz` *→* Lance un petit quizz.\n";
    buildHelp += "- `!vacation _|request|status` *→* si aucun paramètre n'est fournie, affiche les congés disponible pour la personne qui l'a demandé. Request lance une demande de congée automatisée. Status renvoie les statues des différentes demandes de congés faites par le biais du bot.\n";
    buildHelp += "- `!whois [TRI]|[username]` *→* renvoie des informations sur une personne en donnant son trigramme ou son username ( prénom.nom ). Si l'utilisateur n'a pas été trouvé, renvoie une liste de suggestions d'utilisateurs.\n";
    buildHelp += "- `!git attach|detach|list` *→* Gère des webhooks pour gitlab (alertes pour push/merge et pipelines)\n";
    buildHelp += "- `!brokkr` *→* Accéder à dokku et gérer vos merge-request sur gitlab.\n";
    buildHelp += "- `!alarms` *→* Créer des alarmes.\n";
    buildHelp += "- `!tea green|black|herbs` *→* Soyez alerté pour votre thé ou infusion.\n";
    var message = {text: buildHelp};
    return resolve({
      message: {
        title: "Help of R2D2",
        text: buildHelp
      }
    });
  });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.