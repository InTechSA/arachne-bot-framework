'use strict';

exports.ConfigurationManager = class ConfigurationManager {
    constructor(configurationController) {
        this.configurationController = configurationController || require("./../../database/controllers/configurationController");
        this.loadedConfiguration = {}
    }

    getConfiguration() {
        return this.configurationController.get_config();
    }

    reload() {
        return this.getConfiguration().then(config => {
            this.loadedConfiguration = config;
            return config;
        });
    }

    setConfiguration(config) {
        return this.configurationController.set_config(config);
    }

};
