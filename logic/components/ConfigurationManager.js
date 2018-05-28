'use strict';

exports.ConfigurationManager = class ConfigurationManager {
    constructor(configurationController) {
        this.configurationController = configurationController || require("./../../database/controllers/configurationController");
        this.loadedConfiguration = {
            botname: "Arachne",
            lang: "EN"
        }
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

    getLang() {
        return this.configurationController.get_lang();
    }

    setLang(lang) {
        return this.configurationController.set_lang(lang);
    }
    
    getBotname() {
        return this.configurationController.get_botname();
    }

    setBotname(botname) {
        return this.configurationController.set_botname(botname);
    }
};
