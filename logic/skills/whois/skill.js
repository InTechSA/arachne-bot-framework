/*
  SKILL : whois
  AUTHOR : Anonymous
  DATE : 29/03/2018
*/

module.exports = (skill) => {
    const ActiveDirectoryEndpoint = "http://si-ad.intech.lu";
    const axios = skill.loadModule('axios');

    function parserUser(result) {
        var messages;
        var photo = "https://secure.gravatar.com/avatar/4beba8b7f3907e4649a5a5ea410acede?s=100&d=mm&r=g";
        if (result.photo) {
            photo = "data:image/png;base64," + result.photo;
        }
        messages = '> *Trigramme:* ' + result.trigram + '\n';
        messages += '> *Nom:* ' + result.lastName + '\n';
        messages += '> *Prénom:* ' + result.firstName + '\n';
        if (result.email) {
            // Print the email of the user
            messages += '> *Email:* ' + result.email + '\n';
        }
        if (result.telephone && result.telephone.trim().length > 0) {
            // Print the telephone number of the user
            messages += '> *Téléphone:* ' + result.telephone + '\n';
        }
        if (result.mobile && result.mobile.trim().length > 0) {
            // Print the mobile number of the user
            messages += '> *Mobile:* ' + result.mobile + '\n';
        }
        if (result.manager) {
            // Print the manager of the user
            messages += '> *Manager:* ' + result.manager.userName.replace('.', ' ') + ' (' + result.manager.trigram + ')' + '\n';
        }
        if (result.groups) {
            // Print the role of the user
            messages += '> *Rôle:* ' + result.groups.join(',') + '\n';
        }
        if (result.division && result.division.trim().length > 0) {
            // Print the division of the user
            messages += '> *Pôle:* ' + result.division + '\n';
        }
        return ({
            attachments: [
                {
                    title: "Informations disponibles sur " + result.displayName + " (" + result.trigram + ")",
                    color: "black",
                    image_url: photo,
                    text: messages
                }
            ]
        });
    }

    function parserSuggestions(queryWhois, suggestions) {
        var messages;
        if( suggestions.length === 0) messages = " *Didn't find anyone with this query*";
        else messages = "* Didn't find any person with this trigram/username, did you mean : *\n";
        for (var i = 0; i < suggestions.length; i++) {
            messages += "> _ Username : " + suggestions[i].userName + " , Trigram : " + suggestions[i].trigram + " _ \n";
        }
        return ({
            title: "Whois - not found " + queryWhois,
            text: messages
        });
    }

    function suggestions(userQuery, token, byUsername = false) {
        return new Promise((resolve, reject) => {
            skill.log("whois", "Suggestions :: Retrieving all users infos");
            getUserInfos(null, token, false, true).then((response) => {
                var users = response.data;
                var obj = 'trigram';
                if (byUsername) {
                    if(userQuery.indexOf(".") !== -1) {
                        obj = 'userName';
                    } else {
                        obj = 'firstName';
                    }
                }
                users.map(val => {
                    val.sim = levenshteinDistance(val[obj], userQuery);
                });
                
                users = users.filter(el => el.sim < 3);
                users.sort((a, b) => { return a.sim - b.sim });
                if(users.length > 5){
                    users.splice(5, users.length - 4);
                }
                skill.log(users);
                return resolve(users);
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    function levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        var matrix = [];
        var i;
        for (i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        var j;
        for (j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    }

    function getUserInfos(user, token, byUsername = false, allUsers = false) {
        //Form the url used for the AD API, composed with the trigram of the user
        let endPoint = ActiveDirectoryEndpoint + '/users/by-trigram/' + user;
        // if the data have to be retrieve by username
        if (byUsername) {
            // will form the url using the user name
            endPoint = ActiveDirectoryEndpoint + '/users/' + user;
        }
        if (allUsers) {
            endPoint = ActiveDirectoryEndpoint + '/users?cache=false&groups=collaborators&fields=firstname,lastname';
        }
        skill.log('getUserInfos :: url : ' + endPoint);
        var options = {
            url: encodeURI(endPoint),
            headers: {
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/json'
            }
        };
        return axios(options);
    }

    skill.addCommand("whois","whois",({ phrase, data }) => {
        return Promise.resolve().then(() => {
            var query = phrase.trim();
            query = query.split(" ");
            skill.log(query);
            if (query[0].length === 0) {
                return {
                    message: {
                        text: "I am expecting a trigram or a username to search for: `!whois BBN`."
                    }
                }
            }
            switch(query[0]) {
                case "help":
                    return({
                        message: {
                            title: "Whois Help",
                            text: "Pour avoir des informations sur un collaborateurs, tapez soit :\n" +
                                "\n" + ">!whois [trigram] ou !whois [prenom].[nom] de la personne recherché \n" +
                                "> Ou tapez directement Qui est [trigram], Donne moi les informations sur [prenom].[nom]"
                        }
                    });
                default:
                return skill.execute('getToken', { phrase }).then((response) => {
                    const token = response.response.token;
                    skill.log("Retrieved Token");
                    if (query[0].length === 3) {
                        skill.log("By trigram");
                        return getUserInfos(query[0], token).then((response) => {
                            return ({ message: parserUser(response.data) });
                        }).catch((error) => {
                            if(error.response.status === 404 ) {
                                return suggestions(query[0], token).then((suggestions) => {
                                    return ({ message: parserSuggestions(query[0], suggestions) });
                                });
                            } else {
                                throw error;
                            }
                        });
                    } else {
                        if(query[1]) query[0] += "."+query[1];
                        skill.log("By username");
                        return getUserInfos(query[0], token, true).then((response) => {
                            return ({ message: parserUser(response.data) });
                        }).catch((error) => {
                            if(error.response.status === 404 ) {
                                return suggestions(query[0], token, true).then((suggestions) => {
                                    return ({ message: parserSuggestions(query[0], suggestions) });
                                });
                            } else {
                                throw error;
                            }
                        });
                    }
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
        description: "Cherche un collaborateur avec son trigram ou son username, si il n'est pas trouvé, renvoie une suggestion",
        "parameters":[
            {
                "position":0,
                "name":"query",
                "description":"trigram ou username ou query",
                "example":"BBN|benjamin.bertin|benjamin"
            }
        ],
        "examples":[
            {
                "phrase":"whois BBN",
                "action":"Cherche un user avec le trigramme BBN"
            },
            {
                "phrase":"whois benjamin.bertin",
                "action":"Cherche un user avec le username benjamin.bertin"
            },
            {
                "phrase":"whois benjamin",
                "action":"renvoie des suggestions de collaborateurs qui contiennent benjamin dans leur username"
            }
        ]
    });

    skill.addIntent("whois", "whois", ({ entities: { trigram: trigram = [""] }, data }) => {
        return Promise.resolve().then(() => {
            skill.log(trigram[0]);
            skill.log("Nlp Whois");
            return skill.handleCommand("whois",{phrase: trigram[0], data});
        });
    },{
        description: "Donne des informations sur une personne",
        examples: [
            {
                action: "Va chercher les infos d'une personne avec son trigramme, son username, ou fait une recherche par prénom / nom",
                phrases: [
                    "qui est BBN ?",
                    "Je veux connaitre Mathilde",
                    "Tu connais jules.attivissimo ?",
                    "Infos de BBN stp",
                    "Photo de BBN"
                ]
            }]
    });

}