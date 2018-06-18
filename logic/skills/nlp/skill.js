/*
  SKILL : nlp
  AUTHOR : System
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    const secret = require('./secret');
    const request = require('request');

    skill.addCommand("analyze", "analyze", ({ phrase, data }) => {
        return new Promise((resolve, reject) => {
            skill.log(`> [INFO] {nlp} - Analyze "${phrase}".`);
            request({
                url: "https://nlu-api.intech-lab.com/nlp/parse/"+secret.nlu_id,
                method: "POST",
                headers: { 'App-Token': secret.nlu_token },
                body: {
                    "text": phrase
                },
                json: true
            }, (err,res,body) => {
                if(err) {
                    skill.log('> [ERROR] Error contacting the nlu API '+err);
                    return resolve({message : {text: 'Error contacting the nlu API '+err}});
                }
                let analyzed = { };
                try {
                    analyzed.intent = body.data.intent ? body.data.intent.name.toLowerCase() : null;
                      analyzed.entities = {};
                      if(body.data.entities) {
                          for (let entity of body.data.entities) {
                            analyzed.entities[entity.entity.toLowerCase()] = analyzed.entities[entity.entity.toLowerCase()] || [];
                            analyzed.entities[entity.entity.toLowerCase()].push(entity.value);
                          }
                      }
                
                      analyzed.message = {
                        text: analyzed.intent ? `I think your intent is *${analyzed.intent}*.` : `I did'nt found any intent in this sentence.`
                      };

                      return resolve(analyzed);
                } catch(e) {
                    return reject(e);
                }
            });
          });
    });
}