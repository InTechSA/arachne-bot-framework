'use strict';
const path = require('path');
const logger = new (require('./components/Logger'))();

/**
 * Handle an intent. Find the related skill and call it.
 * @param {String} intentName The name of the intent (slug given by nlp service provider).
 * @param {Object} [entities={}] - Entities returned by the nlp service provider (if any).
 * @param {Object} [data={}] - Data sent by the connector to the brain.
 * @return {Promise} Promise object represents the answer of the skill (message to send back to connector, optional data...)
 */
function handleIntent(intentName, entities = {}, data = {}) {
  return Promise.resolve()
    .then(() => {
      logger.info(`Handling intent "\x1b[4m${intentName}\x1b[0m"`);

      return SkillManager.handleIntent(intentName, entities, data)
    })
    .then(response => {
      if (response.message.interactive) {
        return ThreadManager.addThread(response.message.thread).then((thread) => {
          response.message.thread.duration = thread.duration;
          response.message.thread.id = thread._id;

          return { success: true, message: response.message, response: response };
        });
      } else {
        return { success: true, message: response.message, response: response };
      }
    })
    .catch(err => {
      console.log(err);
      logger.warn(`Intent "\x1b[4m${intentName}\x1b[0m" is not handled.`);
      return { success: true, message: { text: ConfigurationManager.loadedConfiguration.noskillfoundnlp.replace('[IntentName]', intentName) } };
    });
}

/**
 * Handle a command. Find the related skill and call it.
 * @param {String} commandName The word of the command to execute.
 * @param {String} [phrase=""] - Parameters of the command (string following command word) sent by connector.
 * @param {Object} [data={}] - Data sent by the connector to the brain.
 * @return {Promise} Promise object represents the answer of the skill (message to send back to connector, optional data...)
 */
function handleCommand(commandName, phrase = "", data = {}) {
  return Promise.resolve().then(() => {
    logger.info(`Handling command "\x1b[4m${commandName}\x1b[0m"`);

    return SkillManager.handleCommand(commandName, phrase, data);
  })
    .then(response => {
      if (response.message.interactive) {
        return ThreadManager.addThread(response.message.thread).then((thread) => {
          response.message.thread.duration = thread.duration;
          response.message.thread.id = thread._id;

          return { success: true, message: response.message, response: response };
        });
      } else {
        return { success: true, message: response.message, response: response };
      }
    })
    .catch(err => {
      return { success: true, message: { text: ConfigurationManager.loadedConfiguration.noskillfound } };
    });
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
  return ConfigurationManager.reload().then(() => {
    return SkillManager.loadSkillsFromFolder();
  });
}

// Create a new SkillManager
const skillComponent = require('./components/SkillManager');
const SkillManager = new skillComponent.SkillManager(this, path.join(__dirname, "./skills"));

// Create and export a new ConnectorManager.
const connectorComponent = require('./components/ConnectorManager');
let ConnectorManager = new connectorComponent.ConnectorManager();
exports.ConnectorManager = ConnectorManager;

// Create and export a new ThreadManager
const threadComponent = require('./components/ThreadManager');
let ThreadManager = new threadComponent.ThreadManager(SkillManager);
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
const PipeManager = new pipeComponent.PipeManager(SkillManager, HookManager);
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
exports.createSkill = (skill) => SkillManager.createSkill(skill);
exports.deleteSkill = (skillName) => SkillManager.deleteSkill(skillName);
exports.getSkills = () => SkillManager.getSkills();
exports.getSkillSecret = (skillName) => SkillManager.getSkillSecret(skillName);
exports.updateSkillSecret = (skillName, secret) => SkillManager.updateSkillSecret(skillName, secret);
exports.getSkill = (skillName) => SkillManager.getSkill(skillName);
exports.hasSkill = (skillName) => SkillManager.hasSkill(skillName);
exports.getHelpBySkills = () => SkillManager.getHelpBySkills();

exports.reloadBrain = reloadBrain;

ConfigurationManager.reload().then(() => {
  logger.info(`Configuration loaded.`);
  return SkillManager.loadSkillsFromDatabase();
}).then(() => SkillManager.loadSkillsFromFolder())
  .catch(err => {
    logger.error(err);
    logger.error(`\x1b[31mFailed to load skills.\x1b[0m`);
  });
