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
            newSkill.code_id = (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).toUpperCase();
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
 * 
 * @param {String} name - The name of the skill to get
 * @returns {Promise<Skill>} A promise to the skill 
 */
module.exports.get_Skill = function(name) {
    return Skill.findOne({name});
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

/** Get the code of a skill.
 * 
 * @param {String} name Name of the skill to get code of.
 */
module.exports.get_code = (name) => {
    return Skill.findOne({ name }, "code code_id").then(skill => {
        if (!skill) {
            const error = new Error("Skill not found.");
            error.code = 404;
            throw error; 
        }
        return skill;
    });
}

/**
 * Save the code of a skill.
 * 
 * @param {String} name - The name of the skill to update.
 * @param {String} code - The code to save.
 * @param {String} codeId - The current id of the code (to check for concurrent modifications).
 * @returns {Promise<Skill>} A promise to the updated skill.
 */
module.exports.save_code = function(name, code, codeId) {
    return Promise.resolve().then(() => {
        if (!name || name.length <= 0) {
            const error = new Error("Can't edit an unamed skill.");
            error.code = 400;
            throw error;
        }
        // Code should at least contain template.
        if (!code || code.length <= 0) {
            const error = new Error("Can't save an empty code.");
            error.code = 400;
            throw error;
        }

        return Skill.findOne({ name });
    }).then(skill => {
        if (!skill) {
            const error = new Error("No skill found.");
            error.code = 404;
            throw error;
        }

        // Code Id is a random string used to check concurrent modifications.
        // The push shall be rejected if the given ID is different from the one stored.
        if (codeId !== skill.code_id) {
            const error = new Error("The skill was updated while you were editing it. You should save your code and reload the page to re-apply your modification.");
            error.code = 409;
            throw error;
        }

        skill.code = code;
        skill.last_update = new Date();
        skill.code_id = (Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2)).toUpperCase();
        
        return skill.save().then(() => {
            return { code_id: skill.code_id };
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

/**
 * Return true if the skill is active, false otherwise
 * @param {String} name - The name of the skill
 */
module.exports.is_active = function(name) {
    return Skill.findOne({ name }).then(skill => {
        if (skill) {
            return skill.active;
        } else {
            return false; // Skill not found in database, will should not activate it.
        }
    });
}

/**
 * Add the connector to the whitelist of the skill
 * @param {String} name - The name of the skill 
 * @param {ObjectID} connectorName - The id connector
 * @return {Promise<Skill>} - A promise with the Skill updated
 */
module.exports.add_whitelist_connector = function(name, connectorName) {
    return Skill.findOne({name}).then(skill => {
        if(skill) {
            if(skill.blacklist_connector.length > 0) {
                return Promise.reject({code: 400, message:"you can't add connector to the white list when the black list isn't empty, please empty your black list first"});
            } else {
                if(skill.whitelist_connector.filter(connector => connectorName === connector).length === 0) {
                    skill.whitelist_connector.push(connectorName);
                    return Skill.updateOne({name},skill);
                } else {
                    return Promise.reject({code: 400, message:"this connector is already white listed"});
                }
            }
        } else {
            return Promise.reject("No skill with this name");
        }
    })
}

/**
 * Add the connector to the blacklist of the skill
 * @param {String} name - The name of the skill 
 * @param {ObjectID} connectorName - The id connector
 * @return {Promise<Skill>} - A promise with the Skill updated
 */
module.exports.add_blacklist_connector = function(name, connectorName) {
    return Skill.findOne({name}).then(skill => {
        if(skill) {
            if(skill.whitelist_connector.length > 0) {
                return Promise.reject({code: 400, message:"you can't add connector to the black list when the white list isn't empty, please empty your white list first"});
            } else {
                if(skill.blacklist_connector.filter(connector => connector === connectorName).length === 0) {
                    skill.blacklist_connector.push(connectorName);
                    return Skill.updateOne({name},skill);
                } else {
                    return Promise.reject({code: 400, message:"this connector is already black listed"});
                }
            }
        } else {
            return Promise.reject("No skill with this name");
        }
    })
}

/**
 * Add the user to the whitelist user of the skill
 * @param {String} name - The name of the skill 
 * @param {String} userName - The name of the user
 * @return {Promise<Skill>} - A promise with the Skill updated
 */
module.exports.add_whitelist_user = function(name, userName) {
    return Skill.findOne({name}).then(skill => {
        if(skill) {
            if(skill.whitelist_user.filter(user => user === userName).length === 0) {
                skill.whitelist_user.push(userName);
                return Skill.updateOne({name},skill);    
            } else {
                return Promise.reject({code: 400, message:"this user is already white listed"});
            }
        } else {
            return Promise.reject("No skill with this name");
        }
    });
}

/**
 * Delete the connector to the whitelist of the skill
 * @param {String} name - The name of the skill 
 * @param {ObjectID} connectorName - The id connector
 * @return {Promise<Skill>} - A promise with the Skill updated
 */
module.exports.delete_whitelist_connector = function(name, connectorName) {
    return Skill.findOne({name}).then(skill => {
        if(skill) {
            var index = skill.whitelist_connector.findIndex((connector) => connector === connectorName);
            if(index !== -1) {
                skill.whitelist_connector.splice(index, 1);
                return Skill.updateOne({name},skill);
            } else {
                return Promise.reject("No connector with this ID in the white list connector of the skill");
            }
        } else {
            return Promise.reject("No skill with this name");
        }
    })
}

/**
 * Delete the connector to the blacklist of the skill
 * @param {String} name - The name of the skill 
 * @param {ObjectID} connectorName - The id connector
 * @return {Promise<Skill>} - A promise with the Skill updated
 */
module.exports.delete_blacklist_connector = function(name, connectorName) {
    return Skill.findOne({name}).then(skill => {
        if(skill) {
            var index = skill.blacklist_connector.findIndex((connector) => connector === connectorName);
            if(index !== -1) {
                skill.blacklist_connector.splice(index, 1);
                return Skill.updateOne({name},skill);
            } else {
                return Promise.reject("No connector with this ID in the white list connector of the skill");
            }
        } else {
            return Promise.reject("No skill with this name");
        }
    })
}

/**
 * Delete the user from the whitelist of the skill
 * @param {String} name - The name of the skill 
 * @param {String} userName - The name of the user
 * @return {Promise<Skill>} - A promise with the Skill updated
 */
module.exports.delete_whitelist_user = function(name, userName) {
    return Skill.findOne({name}).then(skill => {
        if(skill) {
            var index = skill.whitelist_user.findIndex((userNameWhitelist) => userNameWhitelist === userName);
            if(index !== -1) {
                skill.whitelist_user.splice(index, 1);
                return Skill.updateOne({name},skill);
            } else {
                return Promise.reject("No connector with this ID in the white list connector of the skill");
            }
        } else {
            return Promise.reject("No skill with this name");
        }
    });
}
