/*
	SKILL : radar
	UTHOR : "Anonymous"
	DATE : 02/07/2018
*/

module.exports = (skill) => {
    
    const axios = skill.loadModule("axios");
    const url_radar = "https://spreadsheets.google.com/feeds/cells/1ps7k1eDOEn1LlWAIHsaYiA57n9FQsuYezcI154sSe5w/od6/public/values?alt=json";
    
    skill.addCommand("radar","radar",({phrase, data}) => {
        return Promise.resolve().then(() => {
            return axios({
            url: url_radar
            }).then((response) => {
                phrase = phrase.replace("radar","").trim();
                var text = "";
                if(phrase === "list") {
                    for(var tech of response.data.feed.entry) {
                        if(tech.gs$cell.row !== "1" && tech.gs$cell.col === "1") {
                            text += " - *"+tech.gs$cell.$t + "*\n";
                        }
                    }
                    return({
                        message: {
                            title : "liste des technos du radar Intech",
                            text
                        }
                    });
                } else {
                    var index = -1;
                    var color = "black";
                    for(var tech of response.data.feed.entry) {
                        if(tech.gs$cell.$t === phrase) {
                            index = tech.gs$cell.row;
                        }
                        if(tech.gs$cell.row === index) {
                            switch(tech.gs$cell.col) {
                                case "2":
                                    text += " - Etat : " + tech.gs$cell.$t + "\n";
                                    break;
                                case "3":
                                    switch(tech.gs$cell.$t) {
                                        case "plateformes":
                                            color = '#86b782'
                                            break;
                                        case "solution":
                                            color = '#1ebccd';
                                            break;
                                        case "langages & frameworks":
                                            color = '#b32059';
                                            break;
                                        default:
                                            color = '#f38a3e';
                                            break;
                                    }
                                    text += " - Type : " + tech.gs$cell.$t + "\n";
                                    break;
                                case "4":
                                    text += tech.gs$cell.$t.replace(/(.*)<a href="(.*)">(.*)<\/a>(.*)/g,(full,g1,g2,g3,g4) => {
                                        return `${g1}<${g2}|${g3}>${g4}`;
                                    }) + "\n";
                                    break;
                                case "5":
                                    text += " - Date de dernière mise à jour : " + tech.gs$cell.$t;
                                    break;
                            }
                        }
                    }
                    if(index === -1) {
                        return({
                            message: {
                                title: "Tech " + phrase + " not found",
                                text: "Je n'ai pas trouvé de tech dans le radar avec pour nom : *" + phrase + "*, tapez `!radar list` pour avoir la liste des technos du radar"
                            }
                        });
                    } else {
                        return({
                            message: {
                                attachments: [
                                    {
                                        title: phrase,
                                        text,
                                        color
                                    }
                                ]
                            }
                        });
                    }
                }
            }).catch((err) => {
                skill.log(err.message);
                throw "Couldn't contact the radar API";
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
    }, {
        description: "Commande pour afficher les technologies du radar Intech",
        parameters: [
            {
                "position":0,
                "name":"techno",
                "description":"technologie dont vous souhaitez avoir des infos dessus",
                "example":"Docker (`!radar list` pour avoir la liste des technos)"
            }
        ]
    });
    
};