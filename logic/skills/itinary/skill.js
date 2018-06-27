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
            var req = phrase.split("->");
            var des,ori;
            if(req[1]){
                des = encodeURI(req[1]);
                ori = encodeURI(req[0]);
            } else{
                des = encodeURI(req[0]);
                // If the oriign is not specified, it will be Intech
                ori = "Intech%20S.A.,Luxembourg";
            }
            if(des === "help"){
              // If the destionation is help, then print the help
                return ({message:{
                    title: "Itinary",
                    text: "> Help of the itinary command : \n"
                            + "> To do an itinary starting from Intech and going to a destination type : !itinary your_destination\n"
                            + "> To do an itinary starting from a and going to b, type !itinary a -> b\n"
                            + "> CAREFUL, if the destination is not in France, add the country of the destination at the end of it after a comma\n"
                            + "> Example : !itinary Bruxelles, Belgium -> Kayl, Luxembourg"
                    }
                });
            }
            else{
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
        "subcommands":[
            {
                "name":"itinary",
                "cmd":"",
                "description":"Prends deux ou un paramètre en entrée ( séparé par '->' ), si le deuxième est vide, le point de départ sera l'agence",
                "parameters":[
                    {
                        "position":0,
                        "name":"place1",
                        "description":"Premier lieux",
                        "example":"208 Rue de Noertzange, 3622 Kayl"
                    },
                    {
                        "position":1,
                        "name":"place2",
                        "description":"Deuxième lieux",
                        "example":"4 Bisserweg, 1238 Lëtzebuerg"
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
                    }
                ]
            }
        ]
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