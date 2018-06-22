/*
  SKILL : help
  AUTHOR : Anonymous
  DATE : 07/05/2018
*/

module.exports = (skill) => {
    
    const axios = skill.loadModule("axios");
    
    skill.addCommand("help","help",({ phrase, data }) => {
        return Promise.resolve().then(() => {
            phrase.replace("help","").trim();
            phrase = phrase.split(" ");
            return axios({
                url: "http://arachne-bot.intech-lab.com/help/skills"
            }).then((response) => {
                var helpSkills = response.data.skills;
                var text = "";
                var helpCmd;
                switch(phrase[0]) {
                    case "":
                        var j;
                        for(var helpSkill of helpSkills) {
                            if(helpSkill.active) {
                                for(helpCmd of helpSkill.commands) {
                                    text += "- `!" + helpCmd.cmd + "` -> " + helpCmd.help.description + "\n";
                                }
                            }
                        }
                        text += "Pour consultez l'help de chaque commande, tapez `!help [cmd]`, example : `!help git`";
                        return({
                            message: {
                                title: "Help of R2D2",
                                text
                            }
                        });
                    default:
                        var command = phrase[0];
                        var helpCmds = [];
                        helpSkills.map((el) => {
                            if(el.active) {
                                el.commands.map((cmd) =>{
                                    helpCmds.push(cmd);
                                });
                            }
                        });
                        if(helpCmds.filter((cmd) => cmd.cmd === command).length === 0 ) {
                            return({
                                message: {
                                    text: "Pas de commande : " + command + " pour la liste des commandes, tapez `!help`"
                                }
                            });
                        } else {
                            helpCmd = helpCmds.filter((cmd) => cmd.cmd === command)[0];
                            var title = "Aide de " + helpCmd.cmd;
                            text += "Description : " + helpCmd.help.description + "\n";
                            if(helpCmd.help.subcommands) {
                                text += "Liste des commandes associées : \n";
                                for(var subCommand of helpCmd.help.subcommands) {
                                    text += "  - `!" + helpCmd.cmd + " " + subCommand.cmd;
                                    if(subCommand.parameters) {
                                        for(var parameter of subCommand.parameters) {
                                            text += " [" + parameter.name + (parameter.example ? "] (exemple : " + parameter.example + ")":"]");
                                        }
                                    }
                                    text += "`";
                                    if(subCommand.description) {
                                            text += " -> " + subCommand.description;
                                    }
                                    if(subCommand.examples) {
                                        j=0;
                                        text += "\n"+" - - Exemple(s) : ";
                                        for(var example of subCommand.examples) {
                                            text += "`!" + example.phrase + "` -> " + example.action;
                                            j++;
                                            if(j!==subCommand.examples.length) text += " | ";
                                        }
                                    }
                                    text += "\n";
                                }
                            } else {
                                text += "Pas de sous commande ! Utilisez juste `!"+helpCmd.cmd+"`";
                            }
                            return({
                                message: {
                                    title,
                                    text
                                }
                            });
                        }
                }
            }).catch((err) => {
                skill.log(err.message);
                throw "Une erreur est survenue durant l'appel des helps des skills du bot :("; 
            });
        // Build the help
        /* buildHelp = "Voici la liste des commandes disponibles : \n";
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
        buildHelp += "- `!croissant _|moi` *→* Qui est le prochain duo des croissants ?\n";*/
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
        description: "help command"
    });
    
    skill.addIntent("help","get-help",({ entities: { command: command = "" } , phrase , data }) => {
        skill.log("NLP");
        skill.handleCommand("help",{phrase: "help "+command,data});
    });
};