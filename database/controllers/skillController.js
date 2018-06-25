'use strict';
var Skill = require("../models/skillModel");
const storageController = require('./storageController');
const hookController = require('./hookController');
const logController = require('./logController');
const pipeController = require('./pipeController');
/**
 * Create a new skill.
 *
 * @param {String} name - The new skill's name.
 * @param {String} code - The new skill's code.
 * @param {Object} secret = {} - The new skill's secret object..
 * @returns {Promise<Skill>} A promise to the created skill.
 */
module.exports.create_skill = function(name, code, secret = {}) {
    return new Promise((resolve, reject) => {
        if (!name || name.length <= 0) {
            return reject(new Error("Can't create an unamed skill."));
        }
        // Code should at least contain template.
        if (!code || code.length <= 0) {
            return reject(new Error("can't create an empty skill."));
        }
        // Name unicity
        Skill.find({ name }, (err, skills) => {
            if (err) {
                return reject(err);
            }
            if (skills.length > 0) {
                return reject(new Error("There is already a skill with this name."));
            }

            let newSkill = new Skill({ name, code });
            Object.keys(secret).forEach(key => newSkill.secret.set(key, secret[key]));
            newSkill.save().then(skill => resolve(skill)).catch(err => reject(err));
        })
    });
};

/**
 * Get all skills.
 *
 * @returns {Promise<Skill[]>} A promise to the list of skills.
 */
module.exports.get = function() {
    return Skill.find({});
}

/**
 * Delete a skill
 *
 * @param {String} name - The name of the skill to delete.
 * @returns {Promise<>} A promise to the deletion success.
 */
module.exports.delete = function(name) {
    return storageController.clear_storage_for_skill(name)
        .then(hookController.purge_for_skill(name))
        .then(() => {
            return pipeController.remove_for_skill(name);
        }).then(() => {
            return logController.delete(name);
        }).then(() => {
            return Skill.findOneAndRemove({ name });
        });
};

/**
 * Save the code of a skill.
 * 
 * @param {String} name - The name of the skill to update.
 * @param {String} code - The code to save.
 * @returns {Promise<Skill>} A promise to the updated skill.
 */
module.exports.save_code = function(name, code) {
    return new Promise((resolve, reject) => {
        if (!name || name.length <= 0) {
            return reject(new Error("Can't edit an unamed skill."));
        }
        // Code should at least contain template.
        if (!code || code.length <= 0) {
            return reject(new Error("Can't save an empty code."));
        }
        
        Skill.findOneAndUpdate({ name }, { code, last_update: new Date() }, (err, skill) => {
            if (err) {
                return reject(err);
            }
            return resolve(skill);
        });
    });
};

/**
 * Save the secret of a skill.
 * 
 * @param {String} name - The name of the skill to update.
 * @param {Object} secret = {} - The secret object (key: value) to save.
 * @returns {Promise<Skill>} A promise to the updated skill.
 */
module.exports.save_secret = function(name, secret = {}) {
    return new Promise((resolve, reject) => {
        if (!name || name.length <= 0) {
            return reject(new Error("Can't edit an unamed skill."));
        }
        
        Skill.findOne({ name }, (err, skill) => {
            if (err) {
                return reject(err);
            }
            if (!skill) {
                return reject(new Error("No skill with this name."));
            }
            skill.last_update = new Date();
            skill.secret.clear();
            Object.keys(secret).forEach(key => skill.secret.set(key, secret[key]));
            skill.save().then(saved => resolve(saved)).catch(err => reject(err));
        });
    });
};

/**
 * Activate or deactivate a skill.
 * @param {String} name - The name of the skill to toggle.
 * @param {Boolean} active - True to activate the skill, false to deactivate it.
 */
module.exports.toggle = function(name, active = true) {
    return Skill.findOneAndUpdate({ name }, { active });
}

module.exports.is_active = function(name) {
    return Skill.findOne({ name }).then(skill => {
        if (skill) {
            return skill.active;
        } else {
            return false; // Skill not found in database, will should not activate it.
        }
    });
}