/*
  SKILL : greetings
  AUTHOR : System
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    
  skill.addCommand("sayThanks","sayThanks",({ data }) => {
    return new Promise((resolve, reject) => {
      return resolve({
        message: {
          text: `Don't say thanks, ${data.userName.split(".")[0] || "fellow"}!`
        }
      });
    });
  },{
      description: "Dis merci"
  });

  skill.addCommand('sayHello','sayHello',({ data }) => {
    return new Promise((resolve, reject) => {
      return resolve({
        message: {
          text: `Hello ${(data.userName.split(".")[0] || "")} o/`
        }
      });
    });
  },{
      description: "Dis hello"
  });

  skill.addIntent('greetings','handleHello',({ data }) => {
    return skill.handleCommand('sayHello',{ data });
  });
}