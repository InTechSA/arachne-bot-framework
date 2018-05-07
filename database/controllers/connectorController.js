'use strict';
var Connector = require("../models/connectorModel");

module.exports.create_connector = function(name, ip = "") {
  return new Promise((resolve, reject) => {

    let new_connector = new Connector();
    new_connector.name = name;
    new_connector.active = true;
    if (ip) {
      new_connector.ip = ip;
    }
    let token = Math.random().toString(16).substring(2) + Date.now().toString(16) + Math.random().toString(16).substring(2);
    new_connector.token = token;

    new_connector.save((err) => {
      if (err) {
        return reject(err);
      }
      return resolve(new_connector);
    })
  });
};

module.exports.toggleConnector = function(id, status) {
  return new Promise((resolve, reject) => {
    Connector.findByIdAndUpdate(id, { $set : { active : status }}).then((connector) => {
      if (connector) {
        let { _id, active, name } = connector;
        return resolve({ _id, status: active, name });
      } else {
        return reject({
          code: 404,
          message: "No connector with id " + id
        });
      }
    }).catch((err) => {
        console.log(err);
        return reject({
          code: 500,
          message: "Could not update connector."
        });
    });
  });
};

module.exports.checkConnectorToken = function(token) {
  return new Promise((resolve, reject) => {
    Connector.findOne({ token: token }).then((connector, err) => {
      if (err) {
        return resolve(null);
      } else if (connector) {
        return resolve(connector);
      } else {
        return resolve(null);
      }
    });
  });
};

module.exports.getConnectors = function() {
  return new Promise((resolve, reject) => {
    Connector.find({}, "id name active", (err, connectors) => {
      if (err) {
        return reject(err);
      }
      return resolve(connectors);
    });
  });
};

module.exports.getConnector = function(id) {
  return new Promise((resolve, reject) => {
    Connector.findById(id, (err, connector) => {
      if (err) {
        return reject(err);
      } else if (connector) {
        return resolve(connector);
      } else {
        return reject({
          code: 404,
          message: "No connector with id " + id
        });
      }
    });
  });
}

module.exports.getConnectorByName = function(name) {
  return new Promise((resolve, reject) => {
    Connector.findOne({ name: name }, (err, connector) => {
      if (err) {
        return reject(err);
      } else if (connector) {
        return resolve(connector);
      } else {
        return reject({
          code: 404,
          message: "No connector named " + name
        });
      }
    });
  });
}

module.exports.regenerateConnectorToken = function(id) {
  return new Promise((resolve, reject) => {
    Connector.findByIdAndUpdate(id, { $set: { token: Math.random().toString(16).substring(2) + Date.now().toString(16) + Math.random().toString(16).substring(2) }}, (err, connector) => {
      if (err) {
        return reject(err);
      } else if (connector) {
        return resolve(connector);
      } else {
        return reject({
          code: 404,
          message: "No connector with id " + id
        });
      }
    });
  });
};

module.exports.delete_connector = function(id) {
  return new Promise((resolve, reject) => {
    Connector.findByIdAndRemove(id, (err) => {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    });
  });
};

module.exports.update_connector = function(id, { ip: newip, name: newname }) {
  return new Promise((resolve, reject) => {
    let setter = {};
    if (newip) {
      setter.ip = newip;
    }
    if (newname) {
      setter.name = newname;
    }

    Connector.findByIdAndUpdate({ $set: setter }, (err, connector) => {
      if (err) {
        return reject(err);
      } else if (connector) {
        let { _id, active, name, ip } = connector;
        return resolve({ _id, active, name, ip });
      } else {
        return reject({
          code: 404,
          message: "No connector with id " + id
        });
      }
    });
  });
};
