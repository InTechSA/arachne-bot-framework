'use strict';

class HookManager {

  constructor() {
    this.hookController = require("./../../database/controllers/hookController");
    this.io = null;
    this.codes = {
      NO_HOOK: 1,
      NO_CONNECTOR_LINKED: 2,
      NO_CONNECTOR_ONLINE: 3
    }
  }

  /**
   * Attach the brain socket io server to the HookManager.
   * @param {socket.io server} io 
   */
  attachIo(io) {
    this.io = io;
  }

  /**
   * Create a new hook for a skill.
   * @param {String} skill 
   * @param {String} messageOnDelete
   * @return {Promise} Promise to the created hook : { _id, skill }
   */
  create(skill, messageOnDelete = null) {
   return this.hookController.create_hook(skill, messageOnDelete);
  }

  /**
   * Confirm a hook.
   * @param {String} hookId 
   * @param {String} connectorId
   * @return {Promise} Promise that resolves if the hook is validated, false otherwise.
   */
  finalize(hookId, connectorId) {
   return this.hookController.add_connector(hookId, connectorId);
  }

  /**
   * Execute a hook to contact the connector.
   * @param {String} hookId 
   * @param {Object} message - Valid message object to send to the connector.
   * @return {Promise} Promise that resolves if the message was sent, false otherwise.
   */
  execute(hookId, message, {deleteHook = false} = {}) {
    console.log("Delete Hook "+deleteHook);
    return new Promise((resolve, reject) => {
      this.get(hookId).then((hook) => {
        if (!hook) {
          console.log(`> [WARNING] A skill tried to execute an unkown hook ${hookId}.`);
          return reject(this.codes.NO_HOOK);
        }
        if (this.io && this.io.sockets) {
          const socket = Object.values(this.io.sockets.sockets).filter((socket) => {
            return socket.connector.id == hook.connector
          });
          if (socket.length > 0) {
            message.deleteHook = deleteHook;
            
            socket[0].emit('hook',hookId, {
              message
            }, (err) => {
              if(err === 'NO_HOOK'){
                this.remove(hookId);
              }
            });
            console.log(`> [INFO] Executed hook ${hookId}.`);
            return resolve();
          } else {
            return reject(this.codes.NO_CONNECTOR_LINKED);
          }
        } else {
          return reject(this.codes.NO_CONNECTOR_ONLINE);
        }
      }).catch((err) => {
        console.log(err);
        return reject(err);
      });
    });
  }

  /**
   * Remove a hook.
   * @param {String} hookId
   * @return {Promise} Promise that resolves if success, false otherwise.
   */
  remove(hookId) {
   return this.hookController.delete_hook(hookId);
  }

  /**
   * Clear hooks for given skill.
   * @param {String} skill - Name of the skill to purge.
   */
  clearForSkill(skill) {
    return this.hookController.purge_for_skill(skill);
  }

  /**
   * Get hooks by skill name.
   * @param {String} skill - name of the skill to get hooks of.
   */
  getForSkill(skill) {
    return this.hookController.get_by_skill(skill);
  }

  /**
   * Get a hook.
   * @param {String} hookId
   * @return {Promise} Promise to the hook : { _id, skill, connector }
   */
  get(hookId) {
   return this.hookController.get_hook(hookId);
  }
  
  /**
   * Get hooks of connector by id.
   * @param {String} connectorId - Id of connector to get hooks of.
   */
  getForConnector(connectorId) {
   return this.hookController.get_by_connector(connectorId);
  }
}

module.exports.HookManager = HookManager;
