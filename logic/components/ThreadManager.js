'use strict';

exports.ThreadManager = class ThreadManager {
  constructor(interactions) {
    this.threadController = require("./../../database/controllers/threadController");
    this.interactions = interactions;
  }

  /**
   * Create and add a Thread in database.
   * @param {String} [timestamp] - The timestamp of the thread creation.
   * @param {String} [handler] - The name of the handler associated with this thread (will be called on answer).
   * @param {String} [source] - The source message that created this thread.
   * @param {Array[]} [data] - A key-value pair arrai of data to store with the thread.
   * @return {Promise} Promise object represents the created thread.
   */
  addThread({ timestamp: timestamp, handler: handler, source: source = "", data: data = [] }) {
    return this.threadController.create_thread({ timestamp: timestamp, handler: handler, source: source, data: data });
  }

  /**
   * Close a thread and remove it from database.
   * @param {String} threadId - The id of the thread to close.
   * @return {Promise} Promise object resolve if closed, reject otherwise.
   */
  closeThread(threadId) {
    return this.threadController.delete_thread(threadId);
  }

  /**
   * Get a thread in database.
   * @param {String} threadId - The id of the thread to get.
   * @return {Promise} Promise object represents the thread (reject if not found).
   */
  getThread(threadId) {
    return this.threadController.get_thread(threadId);
  }

  /**
   * Handle a Thread answer. Find the related skill and call it.
   * @param {String} threadId The unique id of the thread.
   * @param {String} [phrase=""] - The answer to this thread.
   * @param {Object} [data={}] - Data sent by the connector to the brain.
   * @return {Promise} Promise object represents the answer of the skill (message to send back to connector, optional data...)
   */
  handleThread(threadId, phrase, data = {}) {
    return new Promise((resolve, reject) => {
      this.threadController.get_thread(threadId).then((thread) => {
        console.log(`> [INFO] Handling interaction "\x1b[4m${thread.handler}\x1b[0m"`)
        
        if (this.interactions.has(thread.handler) && this.interactions.get(thread.handler).active) {
          return resolve(this.interactions.get(thread.handler).interact(thread, { phrase, data }));
        } else {
          return reject({ message: "Can not execute this interaction" });
        }
      }).catch((error) => {
        return reject(error);
      });
    });
  }
}
