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
        return this.configurationController.reload().then((config) => {
            Object.entries(config.confList).forEach(([key, val]) => {
                this.loadedConfiguration[key] = val.value;
            });
            return config;
        });
    }

    setConfiguration(config) {
        return this.configurationController.set_config(config);
    }

};
