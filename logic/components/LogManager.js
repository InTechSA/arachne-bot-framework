'use strict';
const logger = new (require('./../../logic/components/Logger'))();

class LogManager {

    /**
     * @constructor
     * 
     * @return - an instance of a LogManager
     */
    constructor() {
        this.logController = require("./../../database/controllers/logController");
        this.buffer = [];
        this.isRunning = false;
        this.size = 100;
        this.maxChar = 500;
    }

    /**
     * This method is there to handle the log in the buffer, while there is something in the buffe, it runs
     */
    bufferHandler() {
        if (this.buffer.length === 0) {
            this.isRunning = false;
            return;
        }
        this.pushLogToDB(this.buffer[0].nameSkill, this.buffer[0].log)
            .then(() => {
                this.buffer.splice(0, 1);
                this.bufferHandler();
            })
            .catch((err) => {
                logger.error(err);
                this.buffer.splice(0, 1);
                this.bufferHandler();
            });
    }

    /**
     * 
     * @param {String} nameSkill - The name of skill asociated to the log
     * @param {String || Object} log - The log to push
     * 
     * THis function will push the new log to put in the buffer and will call it if it's not already executed 
     */
    log(nameSkill, log) {
        this.buffer.push({ nameSkill, log });
        if (!this.isRunning) {
            this.isRunning = true;
            this.bufferHandler();
        }
    }

    /**
     * 
     * @param {String} nameSkill - The name of skill asociated to the log
     * @param {String || Object} log - The log to push
     * 
     * This function will look for an existing log for this skill and if it hasn't found any will create one for this skill
     * Also , the limit of logs to a skill is 100 so it will delete the logs if it goes over 100
     */
    pushLogToDB(nameSkill, log) {
        return new Promise((resolve, reject) => {
            this.logController.getOne(nameSkill).then((Log) => {
                var newLogTable;
                let stringlog = log;
                if (typeof(log) !== 'string') {
                    // will stringigy the object
                    stringlog = JSON.stringify(log); 
                }
                if(stringlog.length > this.maxChar) stringlog = stringlog.substring(0,this.maxChar) + " ... ";
                // Split on the lines
                newLogTable = stringlog.split('\n');
                if (!Log.noLog) {
                    // Existing log
                    // Split on the lines
                    var tableLog = Log.log.split('\n');
                    var returnTab = [];
                    // If the old logs and the new ones are too big
                    if (tableLog.length + newLogTable.length > this.size) {
                        var j = 0;
                        // Keep only the recent ones
                        for (var i = 0; i < this.size; i++) {
                            if (i >= this.size - newLogTable.length) {
                                returnTab.push("[" + new Date().toISOString() + "] " + newLogTable[j]);
                                j++;
                            } else {
                                returnTab.push(tableLog[i + newLogTable.length]);
                            }
                        }
                        this.logController.save_log(nameSkill, returnTab.join('\n')).then(() => {
                            return resolve();
                        }).catch((err) => {
                            return reject(err);
                        });
                    } else {
                        // Else just insert the new logs after the old ones
                        this.logController.save_log(nameSkill, Log.log + '\n' + "[" + new Date().toISOString() + "] " + stringlog).then(() => {
                            return resolve();
                        }).catch((err) => {
                            return reject(err);
                        });
                    }
                } else {
                    if(newLogTable.length > this.size ) {
                        newLogTable.splice(0,newLogTable - this.size);
                    }
                    // NO log for this skill, create one
                    this.logController.create_log(nameSkill, "[" + new Date().toISOString() + "] " + newLogTable.join('\n')).then(() => {
                        return resolve();
                    }).catch(err => {
                        return reject(err);        
                    });
                }
            }).catch(err => {
                logger.error(err)
                return reject(err);
            });
        });
    }

    clearForSkill(skillName) {
        return this.logController.delete(skillName);
    }
}

module.exports.LogManager = LogManager;