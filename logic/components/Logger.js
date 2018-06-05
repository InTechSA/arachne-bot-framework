class Logger {
    constructor() {}

    log(log) {
        console.log(log);
    }

    info(log) {
        console.info("> [INFO] " + log);
    }

    debug(log) {
        console.debug("> [DEBUG] " + log);
    }

    error(log) {
        console.error("> [ERROR] " + log);
    }

    warn(log) {
        console.warn("> [WARNING] " + log);
    }
}

module.exports = Logger; 