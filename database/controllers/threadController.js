'use strict';
var Thread = require("../models/threadModel");



/**
 * Create a new interactive thread.
 *
 * @param {Thread} thread - A Thread representation with at last the TimeStamp and the source message.
 * @returns {Promise<Thread>} A promise to the created Thread.
 */
module.exports.create_thread = function(thread) {
  return new Promise((resolve, reject) => {

    let new_thread = new Thread();
    new_thread.timestamp = thread.timestamp;
    new_thread.source = thread.source;
    new_thread.handler = thread.handler;
    new_thread.data = thread.data || [];
    new_thread.duration = thread.duration && thread.duration > 0 && thread.duration < 60 ? thread.duration : 30; //  Duration in seconds
    new_thread.timeout_message = thread.timeout_message;

    threads[new_thread._id] = new_thread;

    return resolve(new_thread);
  });
};

/**
 * Get the given thread if it exists.
 *
 * @param {string} threadId - The id of the thread to delete.
 * @returns {Promise<Thread>} A promise to the Thread.
 */
module.exports.get_thread = function(threadId) {
  return new Promise((resolve, reject) => {
    if (Object.keys(threads).includes(threadId)) {
      return resolve(threads[threadId]);
    } else {
      return reject({ message: "No thread with id: " + threadId });
    }
  });
};

/**
 * Delete the given thread if it exists.
 *
 * @param {string} threadId - The id of the thread to delete.
 * @returns {Boolean} A promise that resolves if Thread was deleted or if it didn't exixts, rejects otherwise.
 */
module.exports.delete_thread = function(threadId) {
  return new Promise((resolve, reject) => {
    if (Object.keys(threads).includes(threadId)) {
      try {
        delete threads[threadId];
        return resolve(true);
      } catch(e) {
        return reject({ message: "Could not delete thread: " + threadId });
      }
    } else {
      return resolve(true);
    }
  });
};

let threads = {};
