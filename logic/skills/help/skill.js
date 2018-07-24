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
            var cmds = phrase.split(" ");
            return axios({
                url: "http://arachne-api.intech-dev.com/help/skills"
            }).then((response) => {
                var helpSkills = response.data.skills;
                var text = "";
                switch(cmds[0]) {
                    case "":
                        var j;
                        for(var helpSkill of helpSkills) {
                            if(helpSkill.active) {
                                for(var helpCmd of helpSkill.commands) {
                                    text += "- `!" + helpCmd.cmd + "` -> " + helpCmd.help.description + "\n";
                                }
                            }
                        }
                        text += "Pour consultez l'help de chaque commande, tapez `!help [cmd]`, example : `!help git`\nExplorez l'aide en ligne: http://arachne-api.intech-dev.com/manual\n"
                        + "Vous pouvez également voir des exemples de fonctions en langage naturel en tapant `!help nlp`\n\n> Pour utiliser le mode langage naturel, préfixez vos message de 'bot', '@ bot' ou '@ R2D2' dans les canaux public.";
                        return({
                            message: {
                                title: "Help of R2D2",
                                title_url: "http://arachne-api.intech-dev.com/manual",
                                text,
                                noLinkParsing: true
                            }
                        });
                    default:
                        if(cmds[0] === "nlp") {
                            var helpIntents = [];
                            helpSkills.map((el) => {
                                if(el.active) {
                                    el.intents.map((intent) =>{
                                        helpIntents.push(intent);
                                    });
                                }
                            });
                            if(!cmds[1] || cmds[1] === "") {
                                text = "";
                                for(var helpIntent of helpIntents) {
                                    text += "- `" + helpIntent.name + "`, description : " + helpIntent.help.description + "\n";
                                }
                                return({
                                    message: {
                                        title: "Liste des fonctionnalités en langage naturel : ",
                                        text: text + "\n" + "Pour avoir des examples de phrase pour un intent, tapez `!help nlp [nameIntent]` , example : `!help nlp bus`"
                                    }
                                });
                            } else {
                                let helpIntent = helpIntents.filter((helpIntent) => helpIntent.name === cmds[1]);
                                if(helpIntent.length === 0) {
                                    return({
                                        message: {
                                            title: "Pas d'intent avec ce nom, tapez `!help nlp` pour avoir la liste des intents"
                                        }
                                    });
                                } else {
                                    helpIntent = helpIntent[0];
                                    text = '';
                                    skill.log(helpIntent);
                                    if(!helpIntent.help.examples) {
                                        text += "Pas d'exemples :(";
                                    } else {
                                        for(var example of helpIntent.help.examples) {
                                            text += "\n"+"*Action* : " + example.action + "\n";
                                            if(example.phrases) {
                                                text += "*Exemples :*\n";
                                                for(var i = 0; i< example.phrases.length; i++) {
                                                    text += example.phrases[i];
                                                    if(i !== example.phrases.length -1) text += "\n";
                                                } 
                                            } else {
                                                text += "pas de phrases modèles :(";
                                            }
                                            text += "\n";
                                        }
                                    }
                                    return({
                                        message: {
                                            title: "Name : " + helpIntent.name + ", Description : "+helpIntent.help.description,
                                            text
                                        }
                                    });
                                }
                            }
                        } else {
                            var helpCmds = [];
                            helpSkills.map((el) => {
                                if(el.active) {
                                    el.commands.map((cmd) =>{
                                        helpCmds.push(cmd);
                                    });
                                }
                            });
                            if(helpCmds.filter((cmd) => cmd.cmd === cmds[0]).length === 0 ) {
                                return({
                                    message: {
                                        text: "Pas de commande : " + cmds[0] + " pour la liste des commandes, tapez `!help`"
                                    }
                                });
                            } else {
                                let parameter, example;
                                let helpCmd = helpCmds.filter((cmd) => cmd.cmd === cmds[0])[0];
                                var title = "Aide de " + helpCmd.cmd;
                                text += "Description : " + helpCmd.help.description + "\n";
                                if(helpCmd.help.parameters) {
                                    text += "- `!"+helpCmd.cmd;
                                    for(parameter of helpCmd.help.parameters) {
                                        text += " [" + parameter.name + (parameter.example ? "]` (exemple : " + parameter.example + ") `":"]");
                                    }
                                    text += "`";
                                }
                                if(helpCmd.help.examples) {
                                    j=0;
                                    text += "\n"+" - - Exemple(s) : ";
                                    for(example of helpCmd.help.examples) {
                                        text += "`!" + example.phrase + "` -> " + example.action;
                                        j++;
                                        if(j!==helpCmd.help.examples.length) text += " | ";
                                    }
                                } else text += "\n";
                                if(helpCmd.help.subcommands) {
                                    text += "Liste des commandes associées : \n";
                                    for(var subCommand of helpCmd.help.subcommands) {
                                        text += "  - `!" + helpCmd.cmd + " " + subCommand.cmd;
                                        if(subCommand.parameters) {
                                            for(parameter of subCommand.parameters) {
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
                                            for(example of subCommand.examples) {
                                                text += "`!" + example.phrase + "` -> " + example.action;
                                                j++;
                                                if(j!==subCommand.examples.length) text += " | ";
                                            }
                                        }
                                        text += "\n";
                                    }
                                } else {
                                    text += "Pas de sous commande !";
                                }
                                return({
                                    message: {
                                        title,
                                        text
                                    }
                                });
                            }
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
        return skill.handleCommand("help",{phrase: command[0],data});
    },{
        description: "Permet d'afficher l'aide avec une commande ou non",
        examples: [
            {
                action: "Affiche l'aide complète",
                phrases: [
                    "Qu'est-ce que tu sais faire",
                    "Aide",
                    "J'ai besoin d'aide"
                ]
            },{
                action: "Affiche l'aide d'une commande",
                phrases: [
                    "Affiche l'aide pour git",
                    "A quoi sert git",
                    "Je ne comprends pas ce que fait git."
                ]
            }]
    });
};