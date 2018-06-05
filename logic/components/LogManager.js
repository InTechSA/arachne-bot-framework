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
        logger.info("New log for skill "+nameSkill);
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
                logger.info("Taking existing log for "+nameSkill);
                if (!Log.noLog) {
                    // Existing log
                    // Split on the lines
                    var tableLog = Log.log.split('\n');
                    var newLogTable;
                    let stringlog = log;
                    // If it is a string, will split on the line
                    if (typeof (log) === 'string') {
                        newLogTable = log.split('\n');
                    } else {
                        // Else will stringigy the object and split on the lines
                        stringlog = JSON.stringify(log);
                        newLogTable = stringlog.split('\n');
                    }
                    var returnTab = [];
                    // If the old logs and the new ones are too big
                    if (tableLog.length + newLogTable.length > 100) {
                        var j = 0;
                        // Keep only the recent ones
                        for (var i = 0; i < 100; i++) {
                            if (i >= 100 - newLogTable.length) {
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
                    logger.info("Create new log for skill "+nameSkill);
                    // NO log for this skill, create one
                    this.logController.create_log(nameSkill, "[" + new Date().toISOString() + "] " + log).then(() => {
                        return resolve();
                    });
                }
            }).catch(err => {
                logger.error(err)
                return reject(err);
            });
        });
    }
}

module.exports.LogManager = LogManager;