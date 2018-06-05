'use strict';
const path = require('path');
const logger = new (require('./components/Logger'))();

/**
 * Handle an intent. Find the related skill and call it.
 * @param
 {String} intentName The name of the intent (slug given by nlp service provider).
 * @param {Object} [entities={}] - Entities returned by the nlp service provider (if any).
 * @param {Object} [data={}] - Data sent by the connector to the brain.
 * @return {Promise} Promise object represents the answer of the skill (message to send back to connector, optional data...)
 */
function handleIntent(intentName, entities = {}, data = {}) {
  return new Promise((resolve, reject) => {
    logger.info(`Handling intent "\x1b[4m${intentName}\x1b[0m"`);
    if (SkillManager.intents.has(intentName) && SkillManager.intents.get(intentName).active) {
      let intent = SkillManager.intents.get(intentName);

      for (let entity of intent.expected_entities) {
        if (!Object.keys(entities).includes(entity)) {
          return resolve({ success: false, message: { text: `I understand the intent is ${intentName}, but I'm missing some entities. I expect : ${intent.expected_entities.join(", ")}.` }});
        }
      }

      intent.handle({ entities, data }).then((response) => {
        if (response.message.interactive) {
          ThreadManager.addThread(response.message.thread).then((thread) => {
            response.message.thread.duration = thread.duration;
            response.message.thread.id = thread._id;

            return resolve({ success: true, message: response.message, response: response });
          });
        } else {
          return resolve({ success: true, message: response.message, response: response });
        }
      }).catch((err) => {
        return reject(err);
      });
    } else {
      logger.warn(`Intent "\x1b[4m${intentName}\x1b[0m" is not handled.`);
      return resolve({ success: true, message: { text: `I can't handle your intention, yet I think it is *${intentName}*. Maybe it was disabled :/` }});
    }
  })
}

/**
 * Handle a command. Find the related skill and call it.
 * @param {String} commandName The word of the command to execute.
 * @param {String} [phrase=""] - Parameters of the command (string following command word) sent by connector.
 * @param {Object} [data={}] - Data sent by the connector to the brain.
 * @return {Promise} Promise object represents the answer of the skill (message to send back to connector, optional data...)
 */
function handleCommand(commandName, phrase = "", data = {}) {
  return new Promise((resolve, reject) => {
    logger.info(`Handling command "\x1b[4m${commandName}\x1b[0m"`)

    if (SkillManager.commands.has(commandName) && SkillManager.commands.get(commandName).active) {
      let command = SkillManager.commands.get(commandName);
      command.execute({ phrase, data }).then((response) => {
        if (response.message.interactive) {
          ThreadManager.addThread(response.message.thread).then((thread) => {
            response.message.thread.duration = thread.duration;
            response.message.thread.id = thread._id;

            return resolve({ success: true, message: response.message, response: response });
          });
        } else {
          return resolve({ success: true, message: response.message, response: response });
        }
      }).catch((err) => {
        return reject(err);
      });
    } else {
      return resolve({ success: true, message: { text: `I can't handle your command because I don't know it. Maybe it was disabled :/ If not, you can teach me by adding new skills!` }});
    }
  })
}

function handlePipe(skill, identifier, data = {}, headers = {}) {
  // Check is requested skill is active.
  return SkillManager.getSkill(skill).then(skillFound => {
    if (!skillFound || !skillFound.active) {
      const error = new Error("Pipe's skill is not active.")
      error.code = 404;
      throw error;
    }
    return PipeManager.transmit(skill, identifier, data, headers);
  });
}

/**
 * Fully reload all the skills.
 * @return {Promise} promise object that resolves if success.
 */
function reloadBrain() {
  return new Promise((resolve, reject) => {
    ConfigurationManager.reload().then(() => {
      SkillManager.loadSkillsFromFolder();
      return resolve();
    }).catch((e) => {
      return reject(e);
    });
  });
}

// Create a new SkillManager
const skillComponent = require('./components/SkillManager');
const SkillManager = new skillComponent.SkillManager(path.join(__dirname, "./skills"));

// Create and export a new ConnectorManager.
const connectorComponent = require('./components/ConnectorManager');
let ConnectorManager = new connectorComponent.ConnectorManager();
exports.ConnectorManager = ConnectorManager;

// Create and export a new ThreadManager
const threadComponent = require('./components/ThreadManager');
let ThreadManager = new threadComponent.ThreadManager(SkillManager.interactions);
exports.ThreadManager = ThreadManager;

// Create and export a new StorageManager
const storageComponent = require('./components/StorageManager');
let StorageManager = new storageComponent.StorageManager();
exports.StorageManager = StorageManager;

// Create and export a new HookManaher
const hookComponent = require('./components/HookManager');
let HookManager = new hookComponent.HookManager();
exports.HookManager = HookManager;

const pipeComponent = require('./components/PipeManager');
const PipeManager = new pipeComponent.PipeManager(SkillManager);
exports.PipeManager = PipeManager;

const userComponent = require('./components/UserManager');
exports.UserManager = new userComponent.UserManager();

const permissionComponent = require('./components/PermissionManager');
exports.PermissionManager = new permissionComponent.PermissionManager();

const configurationComponent = require('./components/ConfigurationManager');
const ConfigurationManager = new configurationComponent.ConfigurationManager();
exports.ConfigurationManager = ConfigurationManager;

const logComponent = require('./components/LogManager');
let LogManager = new logComponent.LogManager();
exports.LogManager = LogManager;

// Export main handlers
exports.handleIntent = handleIntent;
exports.handleCommand = handleCommand;
exports.handlePipe = handlePipe;

// Exoport skill commands
exports.activateSkill = (skillName) => SkillManager.activateSkill(skillName);
exports.deactivateSkill = (skillName) => SkillManager.deactivateSkill(skillName);
exports.loadSkill = (skillName) => SkillManager.loadSkill(skillName);
exports.reloadSkill = (skillName) => SkillManager.reloadSkill(skillName);
exports.getSkillCode = (skillName) => SkillManager.getSkillCode(skillName);
exports.saveSkillCode = (skillName, code) => SkillManager.saveSkillCode(skillName, code);
exports.addSkill = (skill) => SkillManager.addSkill(skill);
exports.deleteSkill = (skillName) => SkillManager.deleteSkill(skillName);
exports.getSkills = () => SkillManager.getSkills();
exports.getSkillSecret = (skillName) => SkillManager.getSkillSecret(skillName);
exports.updateSkillSecret = (skillName, secret) => SkillManager.updateSkillSecret(skillName, secret);
exports.getSkill = (skillName) => SkillManager.getSkill(skillName);
exports.hasSkill = (skillName) => SkillManager.hasSkill(skillName);

exports.reloadBrain = reloadBrain;

ConfigurationManager.reload().then(() => {
  logger.info(`Configuration loaded.`);
  return SkillManager.loadSkillsFromDatabase();
}).then(() => SkillManager.loadSkillsFromFolder())
  .catch(err => {
    logger.error(err);
    logger.error(`\x1b[31mFailed to load skills.\x1b[0m`);
});
