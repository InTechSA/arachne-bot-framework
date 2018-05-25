'use strict';
const Configuration = require('../models/configurationModel');

module.exports.get_config = () => {
    return Configuration.findOne({}).then(config => {
        // Make sure configuration is in DB.
        if (!config) {
            let configuration = new Configuration();
            return configuration.save();
        }
        return config;
    }).then(config => {
        return config;
    });
};

module.exports.get_botname = () => {
    return this.get_config().then(config => {
        return config.botname;
    });
}

module.exports.set_botname = (botname) => {
    return this.get_config().then(() => {
        return Configuration.findOneAndUpdate({}, { $set: { botname } });
    }).then(() => {
        return botname;
    })
}

module.exports.get_lang = () => {
    return this.get_config().then(config => {
        return config.lang;
    });
}

module.exports.set_lang = (lang) => {
    return this.get_config().then(() => {
        // Check lang validity
        if (!["FR", "EN"].includes(lang)) {
            let error = new Error("lang must be of : ['FR', EN'].")
            error.code = 400;
            throw error;
        }
        return Configuration.findOneAndUpdate({}, { $set: { lang } });
    }).then(() => {
        return lang;
    })
}
