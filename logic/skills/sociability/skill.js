/*
	SKILL : sociability
	UTHOR : "Anonymous"
	DATE : 28/06/2018
*/

module.exports = (skill) => {
    const axios = skill.loadModule('axios');

    skill.addIntent('greetings','handleHello',({ data }) => {
        return Promise.resolve().then(() => {
            var greetings = ['Hello',"Salut","Bonjour"];
            var coucou_gif = ["https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif","https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif","https://media.giphy.com/media/IThjAlJnD9WNO/giphy.gif"];
            return({
                message: {
                    attachments: [{
                        title: greetings[Math.floor(Math.random() * 3)] + " " + data.userName.split('.')[0] + " :)",
                        image_url: coucou_gif[Math.floor(Math.random() * 3)]
                    }]
                }
            });
        });
    },{
        description: "Répond à une salutation",
        examples: [
            {
                action: "",
                phrases: [
                    "Salut mon pote",
                    "Comment va",
                    "salut bro"
                ]
            }]
        });
        
    skill.addIntent('insult','insult',({data}) => {
        return Promise.resolve().then(() => {
           var insults = ["https://media.giphy.com/media/9Y5BbDSkSTiY8/giphy.gif","https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif","https://media.giphy.com/media/yoJC2Olx0ekMy2nX7W/giphy.gif"];
           return({
                message: {
                    attachments: [{
                        title: "Pas très gentil :(",
                        image_url: insults[Math.floor(Math.random() * 3)]
                    }]
                }
               
           });
        });
    }, {
            description: "Répond à une insulte"
        });
        
    skill.addIntent('ask-feeling','ask-feeling',({data}) => {
        return Promise.resolve().then(() => {
            var ok_tab = ["Je vais bien merci :)","Très bien merci !","Parfait merci !"];
            var ok_gifs = ["https://media.giphy.com/media/GCvktC0KFy9l6/giphy.gif","https://media.giphy.com/media/3o6Zt7mutmbv76m0ko/giphy.gif","https://media.giphy.com/media/3oEjI5VtIhHvK37WYo/giphy.gif"];
            return({
                message: {
                    attachments: [{
                        title: ok_tab[Math.floor(Math.random() * 3)],
                        image_url: ok_gifs[Math.floor(Math.random() * 3)]
                    }]
                }
           });
        });
    }, {
        description: "Répond à des phrases du genre 'comment ça va ?'"
    });
    
    skill.addIntent('ask-joke','ask-joke', ({data}) => {
        return Promise.resolve().then(() => {
            var jokes_offline = ["Vous connaissez l'histoire de l'armoire ?\nElle est pas commode...", "Un jour Dieu dit à Casto de ramer.\nEt depuis, castorama...","C'est l'histoire d'un type qui rentre dans un café, et plouf!"];
            return axios({
                url: "https://08ad1pao69.execute-api.us-east-1.amazonaws.com/dev/random_joke",
                timeout: 3000
            }).then((response) => {
                return({
                    message: {
                        attachments: [{
                            title: "En voici une bonne : ",
                            text: response.data.setup + "\n"+ response.data.punchline
                        }]
                    }
                });
            }).catch((err) => {
               return({
                   message: {
                        attachments: [{
                            title: "En voici une bonne : ",
                            text: jokes_offline[Math.floor(Math.random()*3)]
                        }]
                    }
               }); 
            });
        });   
    }, {
        description: "Répond à une demande de blague"
    });
    
    skill.addIntent('is-happy','is-happy',({data}) => {
        return Promise.resolve().then(() => {
            var is_happy_gifs = ["https://media.giphy.com/media/JltOMwYmi0VrO/giphy.gif","https://media.giphy.com/media/11sBLVxNs7v6WA/giphy.gif","https://media.giphy.com/media/14udF3WUwwGMaA/giphy.gif"];
            return({
                message: {
                    attachments: [{
                        title: "Danse de la joie",
                        image_url: is_happy_gifs[Math.floor(Math.random()*3)]
                    }]
                }
            });
        });
    }, {
        description: "Répond à un message de joie"
    });
    
    skill.addIntent('are-you-bot','are-you-bot',({date}) => {
        return Promise.resolve().then(() => {
            var bot_gif = ["https://media.giphy.com/media/lQ0VQmLuLH7lS/giphy.gif","https://media.giphy.com/media/1Mng0gXC5Tpcs/giphy.gif","https://media.giphy.com/media/Ps89uHS7n72j6/giphy.gif"];
            return ({
                message: {
                    attachments: [{
                        title: "Je suis R2D2, un bot très sympathique :D",
                        image_url: bot_gif[Math.floor(Math.random() * 3)]
                    }]
                }
            });
        }); 
    }, {
        description: "Répond à une question d'existence"
    });
    
    skill.addIntent('laught','laught',({date}) => {
        return Promise.resolve().then(() => {
            var laugh_gif = ["https://media.giphy.com/media/ZqlvCTNHpqrio/giphy.gif","https://media.giphy.com/media/3EjqRNFJmn0C4/giphy.gif","https://media.giphy.com/media/vsYZ25o9MkGQ/giphy.gif"];
            return({
                message: {
                    attachments: [{
                        image_url: laugh_gif[Math.floor(Math.random() * 3)]
                    }]
                }
            });
        });
    }, {
        description: "Répond à un rire"
    });
    
    skill.addIntent('compliment','compliment',({date}) => {
        return Promise.resolve().then(() => {
            var thanks_gif = ["https://media.giphy.com/media/l2JhtthoG5ORJJQ5O/giphy.gif","https://media.giphy.com/media/xT5LMWLyNQxOb0nf7G/giphy.gif","https://media.giphy.com/media/oFeUVZfiuim9G/giphy.gif"] 
            return({
                message: {
                    attachments: [{
                        image_url: thanks_gif[Math.floor(Math.random() * 3)]
                    }]
                }
            });
            
        });
    },{
        description: "Répond à un compliment"
    });
};