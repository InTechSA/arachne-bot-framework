/*
  SKILL : itinary
  AUTHOR : Anonymous
  DATE : 30/03/2018
*/

module.exports = (skill) => {
    
    const axios = skill.loadModule('axios');
    // The google api_key used for the request !!Link to my personnal account for the moment!!!
    const GOOGLE_API_KEY = skill.getSecret().google_api_key;

    skill.addCommand("itinary","itinary",({phrase, data})  => {
        return Promise.resolve().then(() => {
            // Split the request to have the origin of the itinary and the destination
            phrase = phrase.replace("itinary","").trim();
            var cmds = phrase.split(" ");
            var des,ori;
            switch(cmds[0]) {
                case "setHome":
                    phrase = phrase.replace("setHome","").trim();
                    if(phrase === "") {
                        return({
                            message: {
                                text: "Addresse pour home vide"
                            }
                        });
                    } else {
                        des = "Intech%20S.A.,Luxembourg";
                        ori = encodeURI(phrase);
                        const url = "https://maps.googleapis.com/maps/api/directions/json?origin="+ori+"&destination="+des+"&departure_time=now&traffic_model=best_guess&key="+GOOGLE_API_KEY;
                        skill.log(url);
                        return axios({
                            url
                        }).then((response) => {
                            if(response.data.status !== "OK") {
                                return({message: {
                                    text: "Votre adresse n'est pas au bon format, veuillez entrez une adresse valide"
                                }});
                            } else {
                                return skill.getItem("homes").then((homes) => {
                                    if(!homes) homes = [];
                                    var homeUserIndex = homes.findIndex((home) => home.user === data.userName);
                                    if(homeUserIndex === -1) {
                                        homes.push({user: data.userName, home: phrase});
                                    } else {
                                        homes[homeUserIndex].home = phrase;    
                                    }
                                    return skill.storeItem("homes",homes).then(() => {
                                        return({
                                            message: {
                                                text: "OK ! Adresse home stockée, vous pouvez maintenant faire `!itinary home` ou `!itinary home -> [lieux]`"
                                            }
                                        });
                                    });
                                });
                            }
                        }).catch((err) => {
                            skill.log(err.message);
                            throw "Erreur d'appel à l'API google maps";
                        });
                    }
                case "getHome":
                    return skill.getItem("homes").then((homes) => {
                        homes = homes.filter((home) => home.user === data.userName); 
                        if(homes.length === 0) {
                            return({
                                message: {
                                    text: "Je n'ai pas d'adresse enregistré pour vous, pour en ajouter une, tapez `!itinary setHome [adresse]`"
                                }
                            });
                        } else {
                            return({
                                message: {
                                    text: "Voilà l'adresse que j'ai enregistré pour vous : " + homes[0].home
                                }
                            });
                        }
                    });
                case "help":
                    return ({message:{
                        title: "Type `!help itinary` for help"
                        }
                    });
                default:
                    var req = phrase.split("->");
                    return skill.getItem("homes").then((homes) => {
                        ori = "Intech%20S.A.,Luxembourg";
                        if(req[0].includes("home") || (req.length === 2 && req[1].includes("home"))) {
                            homes = homes.filter((home) => home.user === data.userName);
                            if(homes.length === 0) {
                                return({
                                    message: {
                                        text: "Vous n'avez pas enregistré d'addresse home, pour en enregistrer une, tapez `!itinary setHome [addresse]`"
                                    }
                                });
                            } else {
                                if(req.length === 2 && req[1].includes("home")) {
                                    des = encodeURI(homes[0].home);
                                    ori = encodeURI(req[0]);
                                } else {
                                    if( req[1] ) {
                                        ori = encodeURI(homes[0].home);
                                        des = encodeURI(req[1]);
                                    } else {
                                        des = encodeURI(homes[0].home);
                                    }
                                }
                            }
                        } else {
                            if(req[1]){
                                des = encodeURI(req[1]);
                                ori = encodeURI(req[0]);
                            } else{
                                des = encodeURI(req[0]);
                            }
                        }
                        // Build the url
                        const url = "https://maps.googleapis.com/maps/api/directions/json?origin="+ori+"&destination="+des+"&departure_time=now&traffic_model=best_guess&key="+GOOGLE_API_KEY;
                        skill.log("URl sent : "+url);
                        return axios({
                          url: url,
                          method: 'GET'
                        }).then((response) => {
                            // Response message
                            // Everything went fine, parsing of the body
                            response = response.data;
                            if(response.status!=="OK"){
                              // No itinary found
                              throw "Il n'existe pas d'itinéraire entre les deux lieux renseignés :(";
                            }
                            else{
                              // Itinary found, we print it
                                const route = response.routes[0];
                                const start_address = route.legs[0].start_address;
                                const end_address = route.legs[0].end_address;
                                return ({
                                    message:{
                                        title: "Itinary",
                                        text: "* Voila votre itinéraire : *\n"
                                        + "> Départ : "+start_address+"\n"
                                        + "> Arrivée : "+end_address+"\n"
                                        + "> Temps éstimé : "+route.legs[0].duration_in_traffic.text+"\n"
                                        + "> Route conseillée : "+route.summary
                                    }
                                });
                            }
                        }).catch((error) => {
                            throw "Je n'ai pas pu contacter l'API google maps :(";
                        });
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
    }, {
        description: "Cherche un itinéraire entre deux lieux",
        "parameters":[
            {
                "position":0,
                "name":"place1",
                "description":"Premier lieux"
            },
            {
                "postition":1,
                "name":"->",
                "description":"flèche entre les deux lieux"
            },
            {
                "position":2,
                "name":"place2",
                "description":"Deuxième lieux"
            }
        ],
        "examples":[
            {
                "phrase":"itinary scott's pub",
                "action":"Cherche un itinéraire de l'agence vers le scott's pub"
            },
            {
                "phrase":"itinary thionville -> scott's pub",
                "action":"Cherche un itinéraire de thionville vers le scott's pub"
            },{
                "phrase":"itinary home",
                "action":"Cherche un itinéraire de Intech à votre home si il a été enregistré"
            },{
                "phrase":"itinary banque du luxembourg, luxembourg city -> home",
                "action":"Cherche un itinéraire de la banque du luxembourg à votre home si il a été enregistré"
            }
        ],
        "subcommands":[
            {
                "name":"set-home",
                "cmd":"setHome",
                "description":"Permet de définir une adresse home pour pouvoir faire !itinary home",
                "parameters":[
                    {
                        "position":0,
                        "name":"home address",
                        "description":"Adresse de votre home que vous souhaitez définir",
                        "example":"55 rue du comté, 45200 Sovengard"
                    }]
            },
            {
                "name":"get-home",
                "cmd":"getHome",
                "description":"Vous renvoie l'adresse que vous avez enregistré en tant que home si elle existe"
            }]
    });

    skill.addIntent("get-itinary","itinary",({ entities: { 'location': location = {}}, data }) => {
        return Promise.resolve().then(() => {
            skill.log(location);
            let phrase = location.length >= 2 ? location[0] + "->" + location[1] : location[0];
            return skill.handleCommand("itinary",{ phrase, data });
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
        description: "Permet d'avoir un itinéraire entre deux lieux ou partant de l'agence Intech",
        examples: [
            {
                action: "Affiche un itinéraire depuis Intech",
                phrases: [
                    "Itinéraire vers Thionville",
                    "Je veux aller à Paris",
                    "Je voudrais allez à la maison"
                ]
            },{
                action: "Affiche un itinéraire d'un endroit à un autre",
                phrases: [
                    "Donne un itinéraire de Paris à Thionville",
                    "Calcule un itinéraire de Paris à Grenoble."
                ]
            }]
    });

};