/*
	SKILL : news
	UTHOR : "Anonymous"
	DATE : 28/06/2018
*/

module.exports = (skill) => {
    
    const axios = skill.loadModule("axios");
    const API_KEY = skill.getSecret().API_KEY;
    
    skill.addCommand("news","news",({ phrase, data}) => {
        return Promise.resolve().then(() => {
            const category = phrase.replace("news","").trim().split(" ")[0];
            var url = "https://newsapi.org/v2/top-headlines?country=fr";
            skill.log(category);
            if(category !== "") {
                if(["business","entertainment","health","science","sports","technology"].includes(category)) {
                    url += "&category=" + encodeURI(category);
                } else {
                    return({
                        message: {
                            title: "Category not found",
                            text: "La categorie " + category + " n'existe pas, choisissez parmis : 'business','entertainment','health','science','sports','technology'"
                        }
                    });
                }
            }
            url += "&apiKey=" + API_KEY;
            skill.log(url);
            return axios({
                url,
                timeout: 5000
            }).then((response) => {
                var nb_article = response.data.totalResults;
                var articles = response.data.articles;
                var i = Math.floor(Math.random() * nb_article);
                skill.log(i);
                return({
                    message: {
                        attachments:[
                            {
                                title: articles[i].source.name + " - " + articles[i].title,
                                text: (articles[i].description || "Pas de description") + "\nCliquez sur le titre pour aller sur l'article",
                                title_link: articles[i].url,
                                image_url: articles[i].urlToImage
                            }]
                    }
                });
            }).catch((err) => {
                skill.log(err.message);
                return ({
                    message: {
                        title: "Je n'ai pas pu contacter la news API :("
                    }
                });
            }); 
        }).catch((err) => {
            skill.log(err.message);
        });
    }, {
        description: "Affiche une news aléatoire récente. Vous pouvez utiliser la commande sans paramètre ou avec un type de news en paramètre",
        "parameters":[
            {
                "position":0,
                "name":"type of news",
                "description":"Type de la news aléatoire que vous voulez avoir",
                "example":"business|entertainment|technology|science|health|sports"
            }
        ],
    });
    
    skill.addIntent("ask-news","ask-news",({phrase, data}) => {
        return skill.handleCommand("news",{phrase: "",data});
    }, {
        description: "Ask for news"
    });
    
};