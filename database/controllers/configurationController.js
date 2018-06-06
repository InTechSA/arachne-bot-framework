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
    })
}