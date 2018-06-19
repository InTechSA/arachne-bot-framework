/*
  SKILL : whois
  AUTHOR : Anonymous
  DATE : 29/03/2018
*/

module.exports = (skill) => {
    const ActiveDirectoryEndpoint = "http://si-ad.intech.lu";
    const axios = require('axios');

    function parserUser(result) {
        var messages;
        var photo = "https://secure.gravatar.com/avatar/4beba8b7f3907e4649a5a5ea410acede?s=100&d=mm&r=g";
        if (result.photo) {
            photo = "data:image/png;base64," + result.photo;
        }
        messages = '*Informations disponibles sur ' + result.trigram + '* \n';
        messages += '> *Trigramme:* ' + result.trigram + '\n';
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
            title: "Whois " + result.displayName,
            attachments: [
                {
                    color: "black",
                    image_url: photo,
                    text: messages
                }
            ]
        });
    }

    function parserSuggestions(queryWhois, suggestions) {
        var messages = "* Didn't find any person with this trigram/username, did you mean : *\n";
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
                    obj = 'userName';
                }
                users.map(val => {
                    val.sim = levenshteinDistance(val[obj], userQuery);
                });
                users.sort((a, b) => { return a.sim - b.sim });
                users.splice(5, users.length - 4);
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
            endPoint = ActiveDirectoryEndpoint + '/users?cache=false&fields=';
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
            var query = phrase.replace('whois', '').trim();
            query = query.split(" ");
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
                return skill.execute('getToken', {phrase, data}).then((response) => {
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
    });

    skill.addIntent("whois", "whois", ({ entities: { 'trigram': trigram = {} }, data }) => {
        return Promise.resolve().then(() => {
            skill.log(trigram);
            skill.log("Nlp Whois");
            return skill.handleCommand("whois",{phrase: "whois "+trigram, data});
        });
    });

}