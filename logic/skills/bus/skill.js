/*
  SKILL : bus
  AUTHOR : Anonymous
  DATE : 30/03/2018
*/
module.exports = (skill) => {

    const axios = skill.loadModule('axios');

    skill.addCommand("bus","bus",({phrase, data}) => {
        return Promise.resolve().then(() => {
          // The url for the bus api
            var url = "http://travelplanner.mobiliteit.lu/restproxy/departureBoard?accessId=cdt&id=A=1@O=Kayl,%20Rue%20de%20Noertzange@X=6,049390@Y=49,496072@U=82@L=220601018@B=1@p=1521640094&format=json&direction=A=1@O=Luxembourg,%20Gare%20Centrale@X=6,133745@Y=49,600625@U=82@L=200405035@B=1@p=1521640094&rtMode=FULL&duration=60&lines=197";
            return axios({
                url: url,
                timeout: 3000
            }).then((response) => {
                // We parse the body
                var result = response.data;
                // We build the return message
                var text = "> Premier Bus : \n";
                text += "> Heure de départ prévue "+result.Departure[0].time+"\n";
                text += "> Heure de départ réelle "+result.Departure[0].rtTime+"\n";
                text += "> Bus d'après : \n";
                text += "> Heure de départ prévue "+result.Departure[1].time+"\n";
                // We return the response
                skill.log("Request to bus api succeeded");
                return ({ message: {title: "Bus Partant de "+result.Departure[0].stop+" en direction de "+result.Departure[0].direction+" avec le "+result.Departure[0].name, text } });
            }).catch((err) => {
                throw "Couldn't contact mobiliteit.lu API :(";
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
        description: "Commande pour avoir les horaires du bus partant de l'agence"
    });
    
    skill.addIntent("bus", "bus", ({ data }) => {
        skill.log("Nlp");
        return skill.handleCommand("bus",{phrase: "bus", data});
    });
};
