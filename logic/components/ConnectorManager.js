'use strict';

exports.ConnectorManager = class ConnectorManager {
  constructor() {
    this.connectorController = require("./../../database/controllers/connectorController");
    this.io = null;
  }

  attachIo(io) {
    this.io = io;
  }

  getConnectors() {
    return this.connectorController.getConnectors();
  }

  getConnector(id) {
    return this.connectorController.getConnector(id);
  }

  getConnectorByName(name) {
    return this.connectorController.getConnectorByName(name);
  }

  createConnector(name, ip = "") {
    return this.connectorController.create_connector(name, ip);
  }

  updateConnector(id, update) {
    return this.connectorController.update_connector(id, update);
  }

  deleteConnector(id) {
    return this.connectorController.delete_connector(id);
  }

  regenerateConnectorToken(id) {
    return this.connectorController.regenerateConnectorToken(id);
  }

  checkConnectorToken(token) {
    return this.connectorController.checkConnectorToken(token);
  }

  toggleConnector(id, status) {
    return new Promise((resolve, reject) => {
      this.connectorController.toggleConnector(id, status).then((connector) => {
        console.log(status);
        console.log(`> [INFO] Setting connector ${connector.name} to ${status ? "active" : "inactive"}...`);
        if (this.io && this.io.sockets) {
          // Reject current socket to force connector to retry connection and handshake.
          const socket = Object.values(this.io.sockets.sockets).filter((socket) => socket.connector.id == id);
          if (socket.length > 0) {
            console.log(`\t... Rejecting current socket connection.`);
            socket[0].disconnect();
          }
        }
        console.log('Done!')
        return resolve(connector)
      }).catch((err) => {
        return reject(err);
      });
    })
  }
}
