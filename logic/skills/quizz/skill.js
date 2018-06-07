/*
  SKILL : quizz
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
    'quizz': {
      cmd: "quizz",
      execute: quizz
    }
  };
  /* </SKILL COMMANDS> */
  
  // intents the skill understands.
  /* <SKILL INTENTS> */
  let intents = {
    'quizz-quizz': {
      slug: "quizz",
      handle: handleQuizz,
      expected_entities: []
    }
  };
  /* </SKILL INTENTS> */
  
  // Conversation handlers of the skill.
  /* <SKILL INTERACTIONS> */
  let interactions = {
    'thread-quizz-handler': {
      name: "thread-quizz-handler",
      interact: answerHandler
    }
  };
  /* </SKILL INTERACTIONS> */
  
  // dependencies of the skill.
  /* <SKILL DEPENDENCIES> */
  let dependencies = ["request"];
  /* </SKILL DEPENDENCIES> */
  
  // Exposing the skill definition.
  exports.commands = commands;
  exports.intents = intents;
  exports.dependencies = dependencies;
  exports.interactions = interactions;
  
  /*
    Skill logic begins here.
    You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
  */
  /* <SKILL LOGIC> */
  const overseer = require('../../overseer');
  const request = require('request');
  
  /**
    Handler for command quizz (!quizz).
  
    Params :
    --------
      phrase: String
  */
  function quizz({ phrase }) {
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
                              timeout_message: "Trop tard ! Soit plus rapide la prochaine fois, la bonne réponse était : "+correct_answer,
                            },
                            title: body.results[0].category,
                            text: question
                        }
                    });
                    } catch(e) {
                        overseer.log("quizz", e);
                        return resolve({message: {text:"Error in the skill :("}});
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
  }
  
  function answerHandler(thread, { phrase }) {
    return new Promise((resolve, reject) => {
      if (phrase === thread.getData("correct_answer")) {
          return resolve({
              message: {
                  title: "Correct o/",
                  text: `${phrase} is the correct answer, congrats!`
              }
          });
      } else if(["abort", "skip"].includes(phrase)) {
          overseer.log("quizz", thread.getData("attemps"));
          return resolve({
              message: {
                  title: "Aborting",
                  text: `The answer was *${thread.getData("correct_answer")}*. ${thread.getData("attemps") || 0} attemps.`
              }
          });
      } else {
        overseer.log("quizz", thread.getData("attemps"));
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
  }
  /**
    Handler for intent quizz-quizz (quizz).
  
    Params :
    --------
      entities (Object)
  */
  function handleQuizz({ entities = {}, phrase, data }) {
    return quizz({ phrase });
  }
  /* </SKILL LOGIC> */
  
  // You may define other logic function unexposed here. Try to keep the skill code slim.