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
                switch(phrase[0]) {
                    case "":
                        var j;
                        for(var helpSkill of helpSkills) {
                            if(helpSkill.active) {
                                for(var helpCmd of helpSkill.commands) {
                                    text += "- `!" + helpCmd.cmd + "` -> " + helpCmd.help.description + "\n";
                                }
                            }
                        }
                        text += "Pour consultez l'help de chaque commande, tapez `!help [cmd]`, example : `!help git`\nExplorez l'aide en ligne: https://arachne-bot.intech-lab.com/manual";
                        return({
                            message: {
                                title: "Help of R2D2",
                                title_url: "https://arachne-bot.intech-lab.com/manual",
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
                            var helpCmd = helpCmds.filter((cmd) => cmd.cmd === command)[0];
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
                                text += "Pas de sous commande !"
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
    
    skill.addIntent("help","get-help",({ entities: { command: command = [""] } , phrase , data }) => {
        skill.log("NLP");
        return skill.handleCommand("help",{phrase: command[0],data});
    });
};