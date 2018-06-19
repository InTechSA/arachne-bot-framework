/*
  SKILL : adauth
  AUTHOR : Anonymous
  DATE : 03/04/2018
*/
var token_AD = null;
var token_expiration = null;
const axios = require('axios');
const jwt = require('jsonwebtoken');

module.exports = (skill) => {

    /**
     * Get a New Token from AD and store the new token in r2d2's brain and the expiration date of the new token
     * @param next the next method that will be executed if the method run wihtout error
     * @return the next function to execute with the parameter err and the new accessToken
     */
    function refreshAccessToken() {
        var username = require("./secret").username;
        var password = require("./secret").password;
        return axios({
            method: 'POST',
            url: 'https://si-ad.intech.lu/authentication',
            data: {
                username: username,
                password: password
            },
        });
    }
    
    skill.addCommand("getToken","getToken", ({ phrase, data }) => {
      return Promise.resolve().then(() => {
        if(!token_AD || token_expiration<=Date.now()){ // Le token est null ou il a expiré
            skill.log("Token null or expired, refreshing it ... ");
            return refreshAccessToken().then((response) => {
                if(response.status !== 201 ) {
                    skill.log("Error : "+response.status+" when refreshing token, please contact administrator");
                    token_AD = null;
                    throw "Error : "+response.status+" when refreshing token, please contact administrator" ;
                } else {
                    //const pubKey = require("./secret").public_key;
                    //jwt.verify(response.data.accessToken, Buffer.from(pubKey.replace(/\\r\\n/g, "\r\n")), (err, decoded) => {
                        //if (err) throw "Error :  " + 403 + " when refreshing token, please contact administrator.";
                        token_AD = response.data.accessToken;
                        token_expiration = response.data.expiresAt *1000;
                        skill.log("Sending token ... ");
                        return({
                            message: {
                                title: "Unauthorized",
                                text: "Vous n'êtes pas autorisé à faire cette commande"
                            },
                            token: token_AD
                        });
                    //}); 
                }
            });
        }
        else{
          return({
            message: {
              title: "Unauthorized",
              text: "You are not allowed to execute this command.",
              color: "red"
            },
            token: token_AD
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
    },{
        description: "Used to retrieve the ad token"
    });
}