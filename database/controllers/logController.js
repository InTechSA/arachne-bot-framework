'use strict';
var Log = require("../models/logModel");

/**
 * Create a new Log.
 *
 * @param {String} nameSkill - The Skill's name associated to the log.
 * @param {String} log - The log to insert in the new log.
 * @returns {Promise<Log>} A promise to the created skill.
 */
module.exports.create_log = function(nameSkill, log) {
    return new Promise((resolve, reject) => {
        if (!nameSkill || nameSkill.length <= 0) {
            return reject(new Error("Can't create a log without an empty skill name."));
        }
        // Code should at least contain template.
        if (!log || log.length <= 0) {
            return reject(new Error("can't create an empty log."));
        }
        // Name unicity
        Log.find({ nameSkill }, (err, logs) => {
            if (err) {
                return reject(err);
            }
            if (logs.length > 0) {
                return reject(new Error("There is already a log with this skill name."));
            }

            let newLog = new Log({ nameSkill, log });
            newLog.save().then(log => resolve(log)).catch(err => reject(err));
        })
    });
};

/**
 * Get all logs.
 *
 * @returns {Promise<Log[]>} A promise to the list of the skills's logs.
 */
module.exports.get = function() {
    return Log.find({});
}

/**
 * Get a log.
 *
 * @returns {Promise<Log>} A promise of a log.
 */
module.exports.getOne = function(nameSkill) {
    return Log.findOne({ nameSkill }).then(log => {
        if(!log) {
            log = {noLog:true, log: "No log for this skill"};
        }
        return log;
    });
}

/**
 * Delete a Log
 *
 * @param {String} nameSkill - The name of the skill associated to the log to delete
 * @returns {Promise<>} A promise to the deletion success.
 */
module.exports.delete = function(nameSkill) {
    return Log.findOneAndRemove({ nameSkill });
};

/**
 * Save a Log.
 * 
 * @param {String} nameSkill - The name of the Log to update.
 * @param {String} log - The log to save.
 * @returns {Promise<Log>} A promise to the updated Log.
 */
module.exports.save_log  = function(nameSkill, log) {
    return new Promise((resolve, reject) => {
        if (!nameSkill || nameSkill.length <= 0) {
            return reject(new Error("Can't edit an unamed Log."));
        }
        // Log should at least contain template.
        if (!log || log.length <= 0) {
            return reject(new Error("Can't save an empty log."));
        }
        
        Log.findOneAndUpdate({ nameSkill }, { log }, (err, Log) => {
            if (err) {
                return reject(err);
            }
            return resolve(Log);
        });
    });
};