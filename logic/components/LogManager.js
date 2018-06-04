'use strict';

class LogManager {

    constructor() {
        this.logController = require("./../../database/controllers/logController");
        this.buffer = [];
        this.isRunning = false;
      }

      bufferHandler() {
          if(this.buffer.length === 0) {
            this.isRunning = false;  
            return;
          }
          this.pushLogToDB(this.buffer[0].nameSkill, this.buffer[0].log)
          .then(() => {
            this.buffer.splice(0,1);
            this.bufferHandler();
          })
          .catch((err) => {
            console.log(err);
            this.buffer.splice(0,1);
            this.bufferHandler();
        });
      }

      log(nameSkill, log) {
          this.buffer.push({nameSkill, log});
          if(!this.isRunning) {
            this.isRunning = true;
            this.bufferHandler();
          }
      }

      pushLogToDB(nameSkill, log) {
          return new Promise((resolve, reject) => {
            this.logController.getOne(nameSkill).then((Log) => {
                var tableLog = Log.log.split('\n');
                var newLogTable = log.split('\n');
                var returnTab = [];
                if(tableLog.length + newLogTable.length > 10) {
                    var j = 0;
                    for(var i=0; i< 10; i++){
                        if(i >= 10 - newLogTable.length) {
                            returnTab.push("[" + new Date().toISOString() + "] " + newLogTable[j]);
                            j++;
                        } else {
                            returnTab.push(tableLog[i+newLogTable.length]);
                        }
                    }
                    this.logController.save_log(nameSkill, returnTab.join('\n')).then(() => {
                        return resolve();
                    }).catch((err) => {
                        return reject(err);
                    });
                } else {
                    this.logController.save_log(nameSkill, Log.log +'\n'+ "[" + new Date().toISOString() + "] " + log).then(() => {
                        return resolve();
                    }).catch((err) => {
                        return reject(err);
                    });
                }
            }).catch((err) => {
                if(err.code === 404) {
                    this.logController.create_log(nameSkill, "[" + new Date().toISOString() + "] " + log).then(() => {
                        return resolve();
                    });
                } else {
                    return reject(err);
                }
            });
          });
      }

}

module.exports.LogManager = LogManager;