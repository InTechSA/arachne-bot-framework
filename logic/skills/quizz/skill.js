/*
  SKILL : quizz
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    const request = require('request');

    skill.addCommand("quizz", "quizz", ({ phrase, data }) => {
        return new Promise((resolve, reject) => {
            request.get({
                url: "https://opentdb.com/api.php?amount=1&difficulty=medium&type=multiple",
                json: "true",
                callback: (err, res, body) => {
                    if (!err && body) {
                        try {
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

                            return resolve({
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
                        } catch (e) {
                            skill.log(e);
                            return resolve({ message: { text: "Error in the skill :(" } });
                        }
                    } else {
                        return resolve({
                            message: {
                                title: "Cannot fetch quizz",
                                text: "Error while requesting quizz service."
                            }
                        });
                    }
                }
            });
        });
    });

    skill.addIntent("quizz", "quizz", ({ entities, data }) => {
        return skill.handleCommand("quizz", { data });
    });

    skill.addInteraction("thread-quizz-handler", (thread, { phrase, data }) => {
        return new Promise((resolve, reject) => {
            skill.log(phrase);
            if (phrase === thread.getData("correct_answer")) {
                return resolve({
                    message: {
                        title: "Correct o/",
                        text: `${phrase} is the correct answer, congrats!`
                    }
                });
            } else if (["abort", "skip"].includes(phrase)) {
                return resolve({
                    message: {
                        title: "Aborting",
                        text: `The answer was *${thread.getData("correct_answer")}*. ${thread.getData("attemps") || 0} attemps.`
                    }
                });
            } else {
                thread.setData("attemps", (thread.getData("attemps") || 0) + 1);
                return resolve({
                    message: {
                        interactive: true,
                        title: "Wrong :(",
                        text: `${phrase} is not the expected answer, try again!`
                    }
                });
            }
        });
    });
}