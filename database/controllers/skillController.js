'use strict';
var Skill = require("../models/skillModel");

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

module.exports.get = function() {
    return Skill.find({});
}

module.exports.delete = function(name) {
    return Skill.findOneAndRemove({ name });
};

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
            Object.keys(secret).forEach(key => skill.secret.set(key, secret[key]));
            skill.save().then(saved => resolve(saved)).catch(err => reject(err));
        });
    });
};