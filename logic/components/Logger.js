class Logger {
    constructor() {}

    log(log) {
        console.log(log); //eslint-disable-line
    }

    info(log) {
        console.info("> [INFO] " + log); //eslint-disable-line
    }

    debug(log) {
        console.debug("> [DEBUG] " + log); //eslint-disable-line
    }

    error(log) {
        console.error("> [ERROR] " + log); //eslint-disable-line
    }

    warn(log) {
        console.warn("> [WARNING] " + log); //eslint-disable-line
    }
}

module.exports = Logger; 