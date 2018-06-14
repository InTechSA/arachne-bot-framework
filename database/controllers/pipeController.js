'use strict';
var Pipe = require("../models/pipeModel");

module.exports.create = (skill, handler, secret = null, hookID = null) => {
    return Promise.resolve().then(() => {
        if (!skill || !handler) {
            // Skill name and handler are required.
            throw new Error("Can't create a hook without skill name, pipe identifier, or handler.");
        }

        const pipe = new Pipe({ skill, handler, identifier: (Math.random().toString(16).substring(2) + new Date().getTime().toString(16)).toUpperCase() });
        
        if (secret) {
            pipe.secret = secret;
        }

        if(hookID) {
            pipe.hookID = hookID;
        }

        return pipe.save();
    });
};

module.exports.remove = (skill, identifier) => {
    return Pipe.findOneAndRemove({ skill, identifier });
}

module.exports.find = (skill, identifier) => {
    return Pipe.findOne({ skill, identifier }, { '_id': 0, '__v': 0 }).then(pipe => {
        if (!pipe) {
            const error = new Error("No pipe found.");
            error.code = 404;
            throw error;
        }
        return pipe;
    });
}

module.exports.get_for_skill = (skill) => {
    return Pipe.find({ skill }, { '_id': 0, '__v': 0 });
}

module.exports.remove_for_skill = (skill) => {
    return Pipe.remove({ skill });
}