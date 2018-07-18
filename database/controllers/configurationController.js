'use strict';
const Configuration = require('../models/configurationModel');

module.exports.get_config = () => {
    return Configuration.findOne({}, { '_id': 0, '__v': 0 }).then(config => {
        // Make sure configuration is in DB.
        if (!config) {
            let configuration = new Configuration();
            return configuration.save();
        }
        return config;
    });
};

module.exports.set_config = (config) => {
    return this.get_config().then(() => { 
        return Configuration.findOneAndUpdate({}, config);
    }).then(() => { 
        return config; 
    });
}

module.exports.reload = () => {
    return Configuration.findOneAndRemove({})
    .then(config => {
        if (!config) {
            return this.get_config();
        }
        var object = config.toObject();
        delete object._id;
        delete object.__v;
        return this.set_config(object);
    });
}