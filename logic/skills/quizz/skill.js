/*
  SKILL : quizz
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    
    const axios = skill.loadModule('axios');

    skill.addCommand("quizz", "quizz", ({ phrase, data }) => {
        return Promise.resolve().then(() => {
            phrase = phrase.split(" ");
            switch(phrase[0]) {
                case "scores":
                    return skill.getItem('scores').then((scores) => {
                        scores = scores.filter((score) => score.channel === data.channel);
                        if(scores.length ===0) {
                            return({
                                message: {
                                    text: "Pas de scores dans ce channel !"
                                }
                            });
                        } else {
                            if(phrase[1] && phrase[1] === 'me') {
                                index = scores.findIndex((score) => score.username === data.userName);
                                if(scores.length === -1 ) {
                                    return({
                                        message: {
                                            text: "Vous n'avez pas de score dans ce channel !"
                                        }
                                    });
                                } else {
                                    return({
                                        message: {
                                            title: "Votre score dans ce channel : ",
                                            text: "Points : " + scores[index].points +", classement : " + (index +1)
                                        }
                                    });
                                }
                            } else {
                                var text = "";
                                for(var i = 0; i < 5 && i < scores.length;i++) {
                                    text += `${i+1}) Username : ${scores[i].username}, points : ${scores[i].points} \n`;
                                }
                                return({
                                    message: {
                                        title: "Top score for this channel : ",
                                        text
                                    }
                                });
                            }
                        }
                    });
                default:
                    return axios({
                        url: "https://opentdb.com/api.php?amount=1&difficulty=medium&type=multiple"
                    }).then((response) => {
                        var body = response.data;
                        let source = decodeURI(body.results[0].question);
                        let question = "Quizz:\n*" + source + "*";
                        let answers = [];
                        let incorrect_answers = [];
                        body.results[0].incorrect_answers.forEach((value) => {
                            incorrect_answers.push(decodeURI(value));
                        });
                        let correct_answer = decodeURI(body.results[0].correct_answer);
                        answers = incorrect_answers;
                        answers.push(correct_answer);
                        answers.sort();
        
                        question += "\n> " + answers.join("\n> ");
                        question += "\n (type `abort` or `skip` to skip)";
                        return({
                            message: {
                                interactive: true,
                                thread: {
                                    source,
                                    data: [
                                        ["correct_answer", correct_answer],
                                        ["incorrect_answers", incorrect_answers]
                                    ],
                                    handler: "thread-quizz-handler",
                                    duration: 30,
                                    timeout_message: "Trop tard ! Soit plus rapide la prochaine fois, la bonne réponse était : " + correct_answer,
                                },
                                title: body.results[0].category,
                                text: question
                            }
                        });
                    }).catch((err) => {
                        throw "Error while requesting quizz api";
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
        description: "Lance un quizz ! <Attention> si vous voulez répondre au quizz en dehors d'un chat privé, ajoutez ! devant votre réponse"
    });

    skill.addIntent("quizz", "quizz", ({ entities, data }) => {
        return skill.handleCommand("quizz", { data });
    },{
        description: "Intent pour lancer un skill",
        examples: [
            {
                action: "Lance un quizz",
                phrases: [
                    "Fais un quiz",
                    "J'aimerais un quizz s'il te plait",
                    "Je peux avoir un quizz ?"
                ]
            }]
    });

    skill.addInteraction("thread-quizz-handler", (thread, { phrase, data }) => {
        return Promise.resolve().then(() => {
            skill.log(phrase);
            if (phrase === thread.getData("correct_answer")) {
                return skill.getItem("scores").then((scores) => {
                    if(!scores) scores = [];
                    var points;
                    var index = scores.findIndex((score) => score.username === data.userName && score.channel === data.channel);
                    if(index !== -1) {
                        scores[index].points++; 
                        points = scores[index].points;
                    }
                    else {
                        points = 1;
                        scores.push({username: data.userName, channel: data.channel, points});
                    }
                    scores.sort((a,b) => {
                        return b.points - a.points;
                    });
                    return skill.storeItem("scores",scores).then(() => {
                        return({
                            message: {
                                title: "Correct o/",
                                text: `${phrase} is the correct answer, congrats! ${data.userName} has now : ${points} points !`
                            }
                        });
                    });
                });
                
            } else if (["abort", "skip"].includes(phrase)) {
                return({
                    message: {
                        title: "Aborting",
                        text: `The answer was *${thread.getData("correct_answer")}*. ${thread.getData("attemps") || 0} attemps.`
                    }
                });
            } else {
                thread.setData("attemps", (thread.getData("attemps") || 0) + 1);
                return({
                    message: {
                        interactive: true,
                        title: "Wrong :(",
                        text: `${phrase} is not the expected answer, try again!`
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
}