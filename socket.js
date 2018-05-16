'use strict';
let hub = require('./logic/hub');

/**
 * socket(.js)
 * 
 * This function is called each time a socket successfully connects to the brain.
 * It will load in memomy all event listeners linked to this socket.
 */
module.exports = function (socket) {
  console.log(`> [INFO] Connector ${socket.connector.name} (${socket.connector.id}) connected!`);

  socket.on('disconnect', function () {
    console.log(`> [INFO] Connector ${socket.connector.name} (${socket.connector.id}) disconnected!`);
  });

  /**
   * 'nlp' socket event is the same as '/nlp' HTTP POST endpoint.
   * 
   * params:
   * -------
   * Destructured Object:
   *   {String} phrase - phrase to analyse and execute.
   *   {Object} data - additionnal data sent by the connector (channel identifier, username...).
   * {callback} res - Will be called to send back info to the connector :
   *   {Object} error - null if success, will contain infos about the error if necessary :
   *      {Integer} status - HTTP error code (will be the same as a HTTP request on '/nlp' endpoint with the same phrase and data).
   *      {String} message - Additionnal informations about the error.
   *   {Object} apiresult - JSON object equivalent to what the same HTTP request should return with the same params.
   *      {Boolean} success
   *      {Object} message - message object the connector should parse, format, and display (see message object formatting).
   */
  socket.on('nlp', ({ phrase = "", data = {} }, res) => {
    if (!phrase) {
      return res({ status: 400, message: 'No phrase string to analyze in body.' }, {
        success: false,
        message: { text: 'No phrase string to analyze in body.' },
        source: phrase
      });
    }

    data.connector = { id: socket.connector.id }; // Automatically add the connector id to the data object.
    hub.handleCommand('analyze', phrase, data).then((response) => {
      if (!response.response.intent) {
        return res(null, {
          success: response.success,
          message: {
            text: `It seems I have no skill that could fit your request, maybe it was disabled, I'm sorry :/`
          },
          source: phrase
        });
      }

      hub.handleIntent(response.response.intent, response.response.entities, data).then((response) => {
        return res(null, { success: response.success, message: response.message, source: phrase });
      }).catch((error) => {
        console.log(error)
        return res({ status: 500 }, { success: false, message: { text: 'Unkown error with nlp endpoint.' }, source: phrase });
      })
    }).catch((error) => {
      console.log(error);
      return res({ status: 500 }, { success: false, message: { text: 'Unkown error with nlp endpoint.' }, source: phrase });
    });
  });

  /**
   * 'command' socket event is the same as '/command' HTTP POST endpoint.
   * 
   * params:
   * -------
   * Destructured Object:
   *   {String} command - command phrase to execute.
   *   {Object} data - additionnal data sent by the connector (channel identifier, username...).
   * {callback} res - Will be called to send back info to the connector :
   *   {Object} error - null if success, will contain infos about the error if necessary :
   *      {Integer} status - HTTP error code (will be the same as a HTTP request on '/command' endpoint with the same command and data).
   *      {String} message - Additionnal informations about the error.
   *   {Object} apiresult - JSON object equivalent to what the same HTTP request should return with the same params.
   *      {Boolean} success
   *      {Object} message - message object the connector should parse, format, and display (see message object formatting).
   */
  socket.on('command', ({ command = "", data = {} }, res) => {
    if (!command) {
      return res({ status: 400, message: "'No command string to parse in body.'" }, { success: false, message: { text: 'No command string to parse in body.' }, source: command });
    }

    let [word, ...params] = command.split(" ");

    data.connector = { id: socket.connector.id }; // Automatically add the connector id to the data object.
    hub.handleCommand(word, params.join(" "), data).then((response) => {
      return res(null, { success: response.success, message: response.message, source: command });
    }).catch((error) => {
      console.log(error);
      return res({ status: 500 }, { success: false, message: { text: 'Unkown error while handling command.' }, source: command });
    });
  });

  /**
   * 'converse' socket event is the same as '/converse' HTTP POST endpoint.
   * 
   * params:
   * -------
   * Destructured Object:
   *   {String} thread_id - the identifier of the thread answered to.
   *   {String} phrase - phrase answered to thread.
   *   {Object} data - additionnal data sent by the connector (channel identifier, username...).
   * {callback} res - Will be called to send back info to the connector :
   *   {Object} error - null if success, will contain infos about the error if necessary :
   *      {Integer} status - HTTP error code (will be the same as a HTTP request on '/converse' endpoint with the same thread_id, phrase and data).
   *      {String} message - Additionnal informations about the error.
   *   {Object} apiresult - JSON object equivalent to what the same HTTP request should return with the same params.
   *      {Boolean} success
   *      {Object} message - message object the connector should parse, format, and display (see message object formatting).
   */
  socket.on('converse', ({ thread_id = "", phrase = "", data = {} }, res) => {
    if (!phrase) {
      return res({ status: 400 }, { success: false, message: { text: 'No answer in body/query.' }, source: phrase });
    }

    if (!thread_id) {
      return res({ status: 400 }, { success: false, message: { text: 'No thread_id in body/query.' } });
    }

    data.connector = { id: socket.connector.id }; // Automatically add the connector id to the data object.
    hub.ThreadManager.handleThread(thread_id, phrase, data).then((response) => {
      return res(null, { success: true, message: response.message, source: phrase, thread_id });
    }).catch((error) => {
      console.log(error);
      return res({ status: 500 }, { success: false, message: { text: 'Unkown error while handling conversation in thread.' }, source: phrase, thread_id });
    });
  });

  /**
   * 'hook-accept' socket event is the same as '/hooks' HTTP POST endpoint.
   * It will confirm the creation of a hook.
   * 
   * params:
   * -------
   * Destructured Object:
   *   {String} hookId - the identifier of the hookId to confirm.
   * {callback} error - Will be called to send back info to the connector :
   *   {String} message - null if success, will contain infos about the error if necessary.
   */
  socket.on('hook-accept', (hookId, error) => {
    hub.HookManager.finalize(hookId, socket.connector.id).then(() => {
      error(null);
    }).catch((err) => {
      console.log(err);
      error("Could not finalize hook.");
    });
  });

  /**
   * 'close-thread-on-timeout' socket event to close a thread on a timeout.
   * 
   * params:
   * -------
   * Destructured Object:
   *   {String} thread_id - the id of the thread we want to close 
   */
  socket.on('close-thread-on-timeout', (thread_id, callback) => {
    hub.ThreadManager.getThread(thread_id).then((thread) => {
      hub.ThreadManager.closeThread(thread_id).then(() => {
        console.log("> [INFO] Thread " + thread_id + " closed");
        return callback(thread.timeout_message);
      }).catch((err) => {
        console.log(err);
        return callback(thread.timeout_message);
      });
    }).catch((err) => {
      console.log(err);
      return callback(null);
    });
  });
};
