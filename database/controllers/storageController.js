'use strict';
var Storage = require("../models/storageModel");

module.exports.create_storage = function(skill, key, value) {
  return new Promise((resolve, reject) => {
    Storage.findOne({ skill, key }, (err, found) => {
      if (err) {
        return reject(err);
      } else if (found) {
        // Override storage.
        found.value = value;
        found.markModified('value');
        found.save((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(found);
        });
      } else {
        // Create enw storage
        let storage = new Storage();
        storage.skill = skill;
        storage.key = key;
        storage.value = value;
        storage.markModified('value');
        storage.save((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(storage);
        });
      }
    });
  });
}

module.exports.get_storage = function(skill, key) {
  return new Promise((resolve, reject) => {
    Storage.findOne({ skill, key }, (err, storage) => {
      if (err) {
        return reject(err);
      } else if (storage) {
        return resolve(storage.value);
      } else {
        return resolve(null);
      }
    });
  });
}

module.exports.get_storage_for_skill = function(skill) {
  return new Promise((resolve, reject) => {
    Storage.find({ skill }, (err, storage) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(storage);
      }
    });
  });
}

module.exports.clear_storage = function() {
  return new Promise((resolve, reject) => {
    Storage.remove({}, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

module.exports.clear_storage_for_skill = function(skill) {
  return new Promise((resolve, reject) => {
    Storage.remove({ skill }, (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
}