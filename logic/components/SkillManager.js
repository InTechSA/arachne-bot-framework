'use strict';
const logger = new (require('./../../logic/components/Logger'))();

const fs = require('fs');
const path = require('path');

const Skill = require('./Skill');

exports.SkillManager = class SkillManager {
  constructor(hub, skillsDirectory) {
    this.hub = hub;

    this.skillController = require("./../../database/controllers/skillController");
    this.skillsDirectory = skillsDirectory;

    this.skills = {
      *[Symbol.iterator]() {
        yield* Object.values(this);
      }
    };

    this.commands = {
      *[Symbol.iterator]() {
        yield* Object.values(this);
      }
    };

    this.intents = {
      *[Symbol.iterator]() {
        yield* Object.values(this);
      }
    };

    this.interactions = {
      *[Symbol.iterator]() {
        yield* Object.values(this);
      }
    };

    this.pipes = {
      *[Symbol.iterator]() {
        yield* Object.values(this);
      }
    };

    this.allowedModules = [
      "request",
      "axios",
      "jsonwebtoken",
      "node-schedule"
    ]
  }

  spawnOverseer(skillName) {
    return {
      getItem: (key) => {
        return this.hub.StorageManager.getItem(skillName, key);
      },
      storeItem: (key, value) => {
        return this.hub.StorageManager.storeItem(skillName, key, value);
      },
      clearItem: (key) => {
        return this.hub.StorageManager.clearItem(skillName, key);
      },
      createHook: (messageOnDelete) => {
        return this.hub.HookManager.create(skillName, messageOnDelete);
      },
      removeHook: (hookId) => {
        return this.hub.HookManager.remove(hookId);
      },
      useHook: (hookId, message, options) => {
        return this.hub.HookManager.execute(hookId, message, options);
      },
      createPipe: (handler, secret) => {
        return this.hub.PipeManager.create(skillName, handler, secret);
      },
      createPipeWithHook: (handler, secret) => {
        return this.hub.PipeManager.createWithHook(skillName, handler, secret);
      },
      deletePipe: (identifier) => {
        return this.hub.PipeManager.remove(skillName, identifier);
      },
      handleCommand: (cmd, { phrase, data }) => {
        return this.hub.handleCommand(cmd, { phrase, data });
      },
      log: (log) => {
        return this.hub.LogManager.log(skillName, log);
      },
      requireModule: (mod) => {
        if (!this.allowedModules.includes(mod)) {
          throw new Error(`Module \x1b[31m${mod}\x1b[0m is not allowed for importation.`)
        }
        return require(mod);
      },
      requireSecret: () => {
        return require(path.join(this.skillsDirectory, `./${skillName}/secret`));
      }
    }
  }

  ////////////////////////////
  // TODO: REFACTORED

  hasSkill(name) {
    return Object.keys(this.skills).includes(name);
  }

  /** Get a skill by name.
   * 
   * @param {String} name Name of the skill to get.
   * @return {Skill} Skill found (nullable).
   */
  getSkill(name) {
    return Promise.resolve().then(() => {
      if (!this.skills[name]) {
        const error = new Error("Skill not found");
        error.code = 404;
        throw error;
      }
      return this.skills[name];
    });
  }

  /** Get list of skills.
   * 
   * @return {Promise} Promise to list of skills.
   */
  getSkills() {
    return Promise.resolve([...this.skills]);
  }

  /** Validate a skill Object against other skills registered.
   * 
   * @param {Skil} skill Skill object to verify. Must be an instance of the Skill class.
   */
  validateSkill(skill) {
    return Promise.resolve().then(() => {
      if (!(skill instanceof Skill)) {
        throw new Error("Attempting to validate a skill that is not an instance of the Skill class.");
      }

      if (!skill.name) {
        throw new Error("Skill.name is not defined.");
      }

      if (this.skills[skill.name]) {
        throw new Error(`[${skill.name}] Skill ${skill.name} already defined.`);
      }

      //////////////////////////////////////////////////////////////////////
      // Skill commands validity
      if (!skill.commands) {
        throw new Error(`[${skill.name}] Skill.commands is not defined.`);
      }

      // Skill command word unicity.
      Object.values(skill.commands).forEach(command => {
        if (this.commands[command.cmd]) {
          throw new Error(`[${skill.name}] Command ${command.cmd} already defined for skill ${this.commands[command.cmd].skill}.`);
        }
      });


      //////////////////////////////////////////////////////////////////////
      // Skill intents validity
      if (!skill.intents) {
        throw new Error(`[${skill.name}] Skill.intents is not defined.`);
      }

      // Skill intent slug unicity
      Object.values(skill.intents).forEach(intent => {
        if (this.intents[intent.slug]) {
          throw new Error(`[${skill.name}] Intent ${intent.slug} already defined for skill ${this.intents[intent.slug].skill}.`);
        }
      });


      //////////////////////////////////////////////////////////////////////
      // Skill interactions validity
      if (!skill.interactions) {
        throw new Error(`[${skill.name}] Skill.interactions is not defined.`);
      }

      // Skill intent slug unicity
      Object.values(skill.interactions).forEach(interaction => {
        if (this.interactions[interaction.name]) {
          throw new Error(`[${skill.name}] Interaction ${interaction.name} already defined for skill ${this.interactions[interaction.name].skill}.`);
        }
      });


      //////////////////////////////////////////////////////////////////////
      // Skill pipes validity
      if (!skill.interactions) {
        throw new Error(`[${skill.name}] Skill.interactions is not defined.`);
      }

      // Skill pipe name unicity
      Object.values(skill.pipes).forEach(pipe => {
        if (this.pipes[pipe.name]) {
          throw new Error(`[${skill.name}] Pipe ${pipe.name} already defined for skill ${this.pipes[pipe.name].skill}.`);
        }
      });


      // Skill does not have conflicts with already loaded skills.


      //////////////////////////////////////////////////////////////////////
      //
      // TODO: Validate the skill's code, execute unit testing on functions.
      //
      //////////////////////////////////////////////////////////////////////

      return true;
    });
  }

  /** Create a new skill.
   * 
   * @param {Object} skill - The skill to create.
   * @param {String} skill.name - The name of a skill.
   * @param {String} skill.code - The code of a skill.
   * @param {Array[]} secret - An array of key-value pair arrays to store secretly for this skill.
   * @return {Promise} Promise object resolves if success, reject otherwise.
   */
  createSkill(skill) {
    return new Promise((resolve, reject) => {

      // TODO: Check skill definition and skill code.
      this.validateSkillCode(skill.code).then((success, reason) => {
        logger.info(`Adding code of skill \x1b[33m${skill.name}\x1b[0m...`);
        logger.log(`\t... Push ${skill.name} to database...`);
        this.skillController.create_skill(skill.name, skill.code).then((savedSkill) => {
          logger.log(`\t... Create ${skill.name} folder...`);
          fs.mkdir(path.join(this.skillsDirectory, `/${skill.name}`), (err) => {
            if (err) {
              logger.error(err);
              return reject({ title: "Could not create folder.", message: "Could not create skill folder on server." });
            }
            logger.log(`\t... Create skill.js in ${skill.name} folder...`)
            fs.writeFile(path.join(this.skillsDirectory, `/${skill.name}/skill.js`), skill.code, (err) => {
              if (err) {
                logger.error(err);
                return reject({ title: "Could not create skill.js file.", message: "Could not create skill.js file on server." });
              }

              if (skill.secret) {
                logger.log(`\t... Create secret.js in ${skill.name} folder...`)
                fs.writeFile(path.join(this.skillsDirectory, `/${skill.name}/secret.js`), "{}", (err) => {
                  if (err) {
                    logger.error(err);
                    return reject({ title: "Could not create secret.js file.", message: "Could not create secret.js file on server." });
                  }
                  logger.info(`Skill \x1b[33m${skill.name}\x1b[0m successfully added to folder.`);
                  return resolve();
                });
              } else {
                logger.info(`Skill \x1b[33m${skill.name}\x1b[0m successfully added to folder.`);
                return resolve();
              }
            });
          });
        }).catch((err) => {
          logger.error(`\t... \x1b[31mFailed\x1b[0m for reason: ${err.message || "Unkown reason"}.`);
          return reject(err);
        });
      }).catch((err) => {
        logger.error(err);
        return reject({ title: "Could not validate skill code.", message: "Could not validate skill code." });
      });
    });
  }

  /** Add a new skill to the brain.
   * 
   * @param {Skill} skill Skill to add.
   * @return {Promise} Promise to the added skill.
   */
  addSkill(skill) {
    return this.validateSkill(skill).then(isValid => {
      if (!isValid) {
        throw new Error("skill is not valid.");
      }

      // Force status to unactive and replace current skill object.
      skill.active = false;
      delete this.skills[skill.name];
      this.skills[skill.name] = skill;

      Object.values(skill.commands).forEach(command => {
        // Command are unique by their command word cmd. Force active to false.
        this.commands[command.cmd] = {
          cmd: command.cmd,
          skill: skill.name,
          active: false
        };
      });

      Object.values(skill.intents).forEach(intent => {
        // Intents are unique by their slug. Force active to false.
        this.intents[intent.slug] = {
          slug: intent.slug,
          skill: skill.name,
          active: false
        };
      });

      Object.values(skill.interactions).forEach(interaction => {
        // Interactions are unique by their name. Force active to false.
        this.interactions[interaction.name] = {
          name: interaction.name,
          skill: skill.name,
          active: false
        };
      });

      Object.values(skill.pipes).forEach(pipe => {
        // Pipes are unique by their name. Force active to false.
        this.pipes[pipe.name] = {
          name: pipe.name,
          skill: skill.name,
          active: false
        };
      });

      return this.getSkill(skill.name);
    });
  }

  /** Remove a skill from brain's memory (will not delete if from Database).
   * 
   * @param {String} name Name of the skill to delete.
   * @return {Promise} Promise to the deleted skill.
   */
  removeSkill(name) {
    return Promise.resolve().then(() => {
      if (!this.skills[name]) {
        return true;
      }

      logger.log(`\tRemoving skill \x1b[33m${name}\x1b[0m...`);
      delete this.skills[name];

      logger.log(`\tRemoving linked Commands...`);
      [...this.commands].forEach(command => {
        if (command.skill === name) {
          delete this.commands[command.cmd];
        }
      });

      logger.log(`\tRemoving associated Intents...`);
      [...this.intents].forEach(intent => {
        if (intent.skill === name) {
          delete this.intents[intent.slug];
        }
      });

      logger.log(`\tRemoving linked Interactions...`);
      [...this.interactions].forEach(interaction => {
        if (interaction.skill === name) {
          delete this.interactions[interaction.name];
        }
      });

      logger.log(`\tRemoving linked Pipes...`);
      [...this.pipes].forEach(pipe => {
        if (pipe.skill === name) {
          delete this.pipes[pipe.name];
        }
      });

      logger.info(`Clearing cache for skill \x1b[33m${name}\x1b[0m`);
      delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${name}/skill`))];
      if (fs.existsSync(path.join(this.skillsDirectory, `/${name}/secret`))) {
        delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${name}/secret`))];
      }

      logger.info(`Skill \x1b[33m${name}\x1b[0m successfully removed.`);
      return true;
    });
  }

  /**
   * Delete a skill from brain's memory and from database.
   * @param {String} skillName - The name of the skill to remove.
   * @return {Promise} Promise object resolves if success, reject otherwise.
   */
  deleteSkill(name) {
    return this.removeSkill(name)
      .then(() => {
        logger.info(`Removing skill \x1b[33m${name}\x1b[0m from database...`);
        return this.skillController.delete(name);
      })
      .then(() => {
        try {
          this.deleteFolderRecursive(path.join(this.skillsDirectory, "/" + name));
          logger.info(`Successfully removed folder ${"/skills/" + name}`);
          return;
        } catch (err) {
          logger.error(`\t... \x1b[31mFailed\x1b[0m for reason: ${err.message || "Unkown reason"}.`);
        }
      });
  }

  /** Activate a skill.
   * This will :
   * - Reload the skill to make sure it has the latest version in memory
   * - Validate it.
   * - Finally activate it. All intents, commands, pipes and interactions will be activated.
   * 
   * @param {String} name Name of the skill to activate.
   * @return {Promise} Promise to the new skill status.
   */
  activateSkill(name) {
    return Promise.resolve(name).then((name) => {
      if (!this.skills[name]) {
        throw new Error(`Skill ${name} is not defined.`);
      }
      return name;
    })
      .then((name) => this.skillController.toggle(name, true))
      .then(() => this.reloadSkill(name))
      .then((skill) => {
        if (skill.active) {
          logger.log(`\t\t... \x1b[32mactivated\x1b[0m`);
        } else {
          logger.log(`\t\t... \x1b[31mnot activated !\x1b[0m`)
        }
        return skill;
      });
  }

  /** Deactivate a skill. All intents, commands, pipes and interactions will be deactivated.
   * 
   * @param {String} name Name of the skill to deactivate.
   * @return {Promise} Promise to the new skill status.
   */
  deactivateSkill(name) {
    return Promise.resolve(name).then((name) => {
      if (!this.skills[name]) {
        throw new Error(`Skill ${name} is not defined.`);
      }
      return name;
    })
      .then((name) => this.skillController.toggle(name, false))
      .then(() => {
        this.skills[name].active = false;
        logger.log(`\t\t... \x1b[32mdeactivated\x1b[0m`);
        return true;
      });
  }

  /** Activate a command.
   * 
   * @param {String} cmd Command word to activate.
   * @return {Promise} Promise to the new command status.
   */
  activateCommand(cmd) {
    return Promise.resolve().then(() => {
      if (!this.commands[cmd]) {
        throw new Error(`Command ${cmd} is not defined.`);
      }

      this.commands[cmd].active = true;
      return true;
    });
  }

  /** Deactivate a command.
   * 
   * @param {String} cmd Command word to deactivate.
   * @return {Promise} Promise to the new command status.
   */
  deactivateCommand(cmd) {
    return Promise.resolve().then(() => {
      if (!this.commands[cmd]) {
        throw new Error(`Command ${cmd} is not defined.`);
      }

      this.commands[cmd].active = false;
      return false;
    });
  }

  hasCommand(cmd) {
    if (!this.commands[cmd] || !this.commands[cmd].active) {
      // command is unactive or undefined.
      return false;
    }
    if (!this.skills[this.commands[cmd].skill] || !this.skills[this.commands[cmd].skill].active) {
      // command skill is undefined or inactive.
      return false;
    }

    return true;
  }

  /** Activate an intent.
   * 
   * @param {String} slug Intent slug to activate.
   * @return {Promise} Promise to the new intent status.
   */
  activateIntent(slug) {
    return Promise.resolve().then(() => {
      if (!this.intents[slug]) {
        throw new Error(`Intent ${slug} is not defined.`);
      }

      this.intents[slug].active = true;
      return true;
    });
  }

  /** Deactivate an intent.
   * 
   * @param {String} slug Intent slug to deactivate.
   * @return {Promise} Promise to the new intent status.
   */
  deactivateIntent(slug) {
    return Promise.resolve().then(() => {
      if (!this.intents[slug]) {
        throw new Error(`Intent ${slug} is not defined.`);
      }

      this.intents[slug].active = false;
      return false;
    });
  }

  hasIntent(slug) {
    if (!this.intents[slug] || !this.intents[slug].active) {
      // Intent is unactive or undefined.
      return false;
    }

    if (!this.skills[this.intents[slug].skill] || !this.skills[this.intents[slug].skill].active) {
      // Intent skill is undefined or inactive.
      return false;
    }

    return true;
  }

  /** Activate a pipe.
   * 
   * @param {String} name Pipe name to activate.
   * @return {Promise} Promise to the new pipe status.
   */
  activatePipe(name) {
    //////////////////////////////////////////////////////////////////////
    //
    // TODO: activation of pipes.
    //
    //////////////////////////////////////////////////////////////////////
    return Promise.resolve().then(() => {
      throw new Error("Pipes can't be activated, because they can't be deactivated.");
    });
  }

  /** Deactivate a pipe.
   * 
   * @param {String} nam Pipe name to deactivate.
   * @return {Promise} Promise to the new pipe status.
   */
  deactivatePipe(name) {
    //////////////////////////////////////////////////////////////////////
    //
    // TODO: deactivation of pipes.
    //
    //////////////////////////////////////////////////////////////////////
    return Promise.resolve().then(() => {
      throw new Error("Pipes can't be deactivated.");
    });
  }

  /** Activate an interaction.
   * 
   * @param {String} name Interaction name to activate.
   * @return {Promise} Promise to the new interaction status.
   */
  activateInteraction(name) {
    return Promise.resolve().then(() => {
      throw new Error("Interact can't be activated, because they can't be deactivated.");
    });
  }

  /** Deactivate an interaction.
   * 
   * @param {String} nam Interactionipe name to deactivate.
   * @return {Promise} Promise to the new interaction status.
   */
  deactivateInteraction(name) {
    return Promise.resolve().then(() => {
      throw new Error("Interact can't be deactivated.");
    });
  }

  /** Is the interaction active ?
   * 
   * @param {String} name Name of the interaction.
   */
  hasInteraction(name) {
    if (!this.interactions[name] || !this.interactions[name].active) {
      // Interaction is unactive or undefined.
      return false;
    }

    if (!this.skills[this.interactions[name].skill] || !this.skills[this.interactions[name].skill].active) {
      // Interaction skill is undefined or inactive.
      return false;
    }

    return true;
  }

  /** Load a skill from folder.
   * 
   * @param {String} name Name of the skill to load (folder name).
   * @return {Promise} Promise to Skill object resolve if success, reject otherwise.
   */
  loadSkill(name) {
    return this.removeSkill(name)
      .then(() => {
        logger.log(`Loading skill \x1b[33m${name}\x1b[0m...`);

        // Clear require cache for this skill.
        delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${name}/skill`))];
        if (fs.existsSync(path.join(this.skillsDirectory, `/${name}/secret`))) {
          delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${name}/secret`))];
        }

        return this.validateSkillCode(fs.readFileSync(path.join(this.skillsDirectory, `/${name}/skill.js`))).then(() => {
          return true;
        }).catch(err => {
          // Could not require the skill. Reset the skill to an empty one and add it to the brain.
          logger.error(`\x1b[33m${name}\x1b[0m has an invalid code and could not be required. Replaced by an empty skill.`);

          const overseer = this.spawnOverseer(name);
          let skill = new Skill(name, overseer);

          // Then throw back the error to retrieve it.
          return this.addSkill(skill).then((skill) => {
            err.skill = skill.name;
            throw err;
          });
        });
      })
      .then(() => {
        return this.skillController.is_active(name);
      })
      .then((status) => {
        const overseer = this.spawnOverseer(name);
        let skill = new Skill(name, overseer);
        try {
          require(path.join(this.skillsDirectory, `/${name}/skill`))(skill);
          // Activate skill if it was already active.
          return this.addSkill(skill).then(skill => {
            if (status) {
              this.skills[name].active = true;

              // activate all components
              Object.values(skill.commands).forEach(command => {
                this.commands[command.cmd].active = true;
              });

              Object.values(skill.intents).forEach(intent => {
                this.intents[intent.slug].active = true;
              });

              Object.values(skill.interactions).forEach(interaction => {
                this.interactions[interaction.name].active = true;
              });

              Object.values(skill.pipes).forEach(pipe => {
                this.pipes[pipe.name].active = true;
              });

              return skill;
            }
            return skill;
          }).catch((err) => {
            logger.error(`\x1b[33m${name}\x1b[0m could not be required. Replaced by an empty skill.`);

            skill = new Skill(name, overseer);

            // Then throw back the error to retrieve it.
            return this.addSkill(skill).then((skill) => {
              err.skill = skill.name;
              throw err;
            });
          });
        } catch (e) {
          // Could not require the skill. Reset the skill to an empty one and add it to the brain.
          logger.error(`\x1b[33m${name}\x1b[0m could not be required. Replaced by an empty skill.`);

          skill = new Skill(name, overseer);

          // Then throw back the error to retrieve it.
          return this.addSkill(skill).then((skill) => {
            e.skill = skill.name;
            throw e;
          });
        }
      })
      .then((skill) => {
        logger.log(`\x1b[33m${name}\x1b[0m successfully loaded ${skill.active ? `And \x1b[32mactivated\x1b[0m` : `But \x1b[31mnot activated\x1b[0m`}.`);
        return skill;
      })
      .catch((err) => {
        logger.error(`\x1b[33m${name}\x1b[0m could not load:\n\t${err.message}`);
        throw err;
      });
  }

  /** Reload a skill.
   * 
   * @param {String} name Name of the skill to reload.
   * @return {Promise} Promise to Skill object resolve if success, reject otherwise.
   */
  reloadSkill(name) {
    return this.loadSkill(name);
  }

  /** Load skills from /logic/skills folder by names.
   * Store commands and intents into memory : skills, commands and intents.
   * 
   * @param {String[]} skillsToLoad The names of skills to load.
   */
  loadSkills(skillsToLoad) {
    return Promise.resolve().then(() => {
      logger.info(`Loading skills...`);

      const loaders = [];
      skillsToLoad.forEach((name) => {
        loaders.push(() => {
          return this.loadSkill(name);
        });
      });

      return loaders.reduce((chain, current) => {
        return chain.then((results) => {
          return current(results).then(res => results).catch(e => {
            results.push(e);
            return results;
          });
        });
      }, Promise.resolve([])).then(errors => {
        if (errors.length >= 1) {
          let message = `> [ERROR] Could not load all skills...\n`;
          message += errors.map(error => `\t...[\x1b[33m${error.skill || "System"}\x1b[0m] - ${error.message}`).join("\n");
          message += `\n... These skills were not loaded.`
          logger.error(message);
        }
      }).then(() => {
        logger.info(`Completed load of skills.`);
        logger.log("               ");
        logger.info(`Loaded Skills: ${[...this.skills].map(skill => skill.name).join(", ")}`);
        logger.info(`Available Commands: ${[...this.commands].map(command => command.cmd).join(", ")}`);
        logger.info(`Plugged Intents: ${[...this.intents].map(intent => intent.slug).join(", ")}`);
        logger.info(`Handled Interactions: ${[...this.interactions].map(interaction => interaction.name).join(", ")}`);
        logger.info(`Opened Pipes: ${[...this.pipes].map(pipe => pipe.name).join(", ")}`);
        return;
      });
    });
  }

  /**
   *  Get list of directories at a given path.
   * @param {String} srcPath - path where to get list of directories.
   * @return {Array} Array of directories names.
   */
  getDirectories(srcpath) {
    return fs.readdirSync(srcpath).filter(function (file) {
      return fs.statSync(path.join(srcpath, file)).isDirectory();
    });
  }

  /**
   * Delete everything in a folder (recursive, including the folder).
   * @param {String} path - folder to remove.
   */
  deleteFolderRecursive(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function (file, index) {
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          this.deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  }

  /**
   * Load skills from database (on bot start) and create local files.
   */
  loadSkillsFromDatabase() {
    logger.info(` Retrieving skills from Database...`);
    return this.skillController.get().then(skills => {
      logger.log(`\t... Done. Writing kills to local disk...`);
      // Create files for each skill.
      // Will override any local files.
      // But will retain untracked local skills.
      for (const skill of skills) {
        logger.info(` Taking care of \x1b[33m${skill.name}\x1b[0m...`);

        // Remove local folder if present.
        if (fs.existsSync(this.skillsDirectory + "/" + skill.name)) {
          // Override this folder.
          logger.log(`\t... Removing folder.`);
          this.deleteFolderRecursive(this.skillsDirectory + "/" + skill.name);
        }

        // Create the folder for this skill.
        logger.log(`\t... Init folder.`);
        fs.mkdirSync(this.skillsDirectory + "/" + skill.name);

        // Write code and secret files to disk.
        logger.log(`\t... Writing code file.`);
        fs.writeFileSync(this.skillsDirectory + "/" + skill.name + "/skill.js", skill.code, "utf-8");
        logger.log(`\t... Writing secret file.`);
        let secret = `module.exports = {\n${[...skill.secret.keys()].map((key) => `"${key}": "${skill.secret.get(key)}"`).join(",\n")}\n}`;
        fs.writeFileSync(this.skillsDirectory + "/" + skill.name + "/secret.js", secret, "utf-8");

        logger.log(`\t... \x1b[32mDone\x1b[0m!`)
      }
    });
  }

  /**
   * Load skills from skills folder (on bot start).
   * And save skills that are only in the local folders but not in the DB ( with their secret );
   * @returns {Promise}
   */
  loadSkillsFromFolder() {
    return Promise.resolve().then(() => {
      let skillsFolders;
      logger.info(` Loading skills directory: "\x1b[4m${"/skills"}\x1b[0m"...`);
      skillsFolders = this.getDirectories(this.skillsDirectory)
      logger.info(` Skills folders found: \x1b[33m${skillsFolders.join(", ")}\x1b[0m.`);
      return this.skillController.get().then(skills_db => {
        const skillsNameInDb = skills_db.map((skill => skill.name));
        const skillsToPersist = skillsFolders.filter(skillName => !skillsNameInDb.includes(skillName));
        const loaders = skillsToPersist.map(skill => {
          return Promise.resolve().then(() => {
            logger.log(`\t... Persist skill ${skill} in database...`);

            // Extract the skill code
            if (fs.existsSync(this.skillsDirectory + "/" + skill + "/skill.js")) {
              const skill_code = fs.readFileSync(this.skillsDirectory + "/" + skill + "/skill.js");
              // Extract the secret ( if it exist )
              var secret = {};
              if (fs.existsSync(this.skillsDirectory + "/" + skill + "/secret.js")) {
                secret = require(this.skillsDirectory + "/" + skill + "/secret");
              }

              return this.skillController.create_skill(skill, skill_code, secret).then(() => {
                logger.log(`\t... Persisted skill ${skill} in database...`);
              });
            } else {
              logger.error(`\t... Skill ${skill} has no skill.js file in folder! This is a critical error, that should only appear in dev environment. Please delete the skill folder.`);
              return;
            }
          })
        });

        logger.info(`Persist local skills in database...`);

        return Promise.all(loaders).then(() => {
          if (loaders.length > 0) {
            logger.info("Inserted successfully new skills  " + skillsToPersist.join(',') + " from local to the database");
          } else {
            logger.info("No local skills to persist.");
          }

          // Load skills on module require (bot start).
          return this.loadSkills(skillsFolders);
        });
      });
    });
  }

  /**
   * Get a skill's code.
   * @param {String} skillName - The name of the skill to get code of.
   * @return {Promise} Promise object represents the skill's code.
   */
  getSkillCode(skillName) {
    return this.skillController.get_code(skillName);
  }

  /**
   * Validate a skill's code before saving it.
   * @param {String} code - The code of the skill to validate.
   * @return {Promise} Promise object (true, null) if validated, (false, string reason) otherwise.
   */
  validateSkillCode(code) {
    return Promise.resolve(code).then(code => {
      logger.info(`Validating code of skill...`);

      ////////////////////////////////////////////////
      // TODO: WARNING: This check is unsafe.
      ////////////////////////////////////////////////

      // Skill code should not contain any requires.
      if (code.includes("require(")) {
        throw new Error(`The use of the '\x1b[31mrequire\x1b[0m' Symbol is strictly forbidden. Use skill.loadModule(module) or skill.getSecret() instead.`);
      }

      return true;
    });
  }

  /**
   * Get secrets for a skill.
   * @param {String} skillName - The name of the skill to get secret of.
   * @return {Promise} Promise to the secret array of key-value pair.
   */
  getSkillSecret(skillName) {
    return new Promise((resolve, reject) => {
      if (this.skills[skillName]) {
        if (fs.existsSync(path.join(this.skillsDirectory, `/${skillName}/secret.js`))) {
          delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/secret`))];
          const secrets = require(path.join(this.skillsDirectory, `/${skillName}/secret`));
          let secret = [];
          for (let [key, value] of Object.entries(secrets)) {
            secret.push([key, value]);
          }
          return resolve(secret);
        } else {
          return resolve([]);
        }
      } else {
        return resolve(null);
      }
    });
  }

  /**
   * Update a skill's secrets.
   * 
   * @param {String} skillName - The name of the skill to update secret of.
   * @param {Array} secrets - Key-value apir array.
   */
  updateSkillSecret(name, secrets) {
    return new Promise((resolve, reject) => {
      if (this.skills[name]) {
        let secret = {};
        for (let [key, value] of secrets) {
          if (key.length > 0) {
            // Don't retain empty keys.
            secret[key] = value;
          }
        }

        logger.info(`Saving secret of skill \x1b[33m${name}\x1b[0m...`);
        logger.log(`\t... Push ${name} secret to database...`);
        this.skillController.save_secret(name, secret).then(skill => {
          let filePath = path.join(this.skillsDirectory, `/${name}/secret.js`);
          // Using stream is the recommended method to edit files with potentiel concurrency.
          let stream = fs.createWriteStream(filePath);
          stream.on("error", (error) => {
            logger.error(error);
            return reject();
          });
          stream.on("finish", () => {
            logger.log(`\t... Reload skill.`);

            delete require.cache[require.resolve(filePath)];
            this.reloadSkill(name).then(() => {
              return resolve();
            }).catch((err) => {
              logger.error(err);
              return reject();
            });
          });
          stream.write(`module.exports = ${JSON.stringify(secret)};`, 'utf8');
          stream.end();
        }).catch(err => {
          logger.error(`\t... \x1b[31mFailed\x1b[0m for reason: ${err.message || "Unkown reason"}.`);
          return reject(new Error("Could not push skill code."));
        });

      } else {
        return reject({ code: 404, message: "No skill named " + name });
      }
    });
  }

  /**
   * Save a skill's code.
   * @param {String} skillName - The name of the skill where to save code.
   * @param {String} code - The code of the skill to save.
   * @return {Promise} Promise object resolves if success, reject otherwise.
   */
  saveSkillCode(skillName, code, codeId) {
    return new Promise((resolve, reject) => {
      this.validateSkillCode(code).then(success => {
        logger.info(`Saving code of skill \x1b[33m${skillName}\x1b[0m...`);
        logger.log(`\t... Push ${skillName} to database...`);
        this.skillController.save_code(skillName, code, codeId).then((skill) => {
          logger.log(`\t... Writing code file of ${skillName}...`);
          fs.writeFile(path.join(this.skillsDirectory, `/${skillName}/skill.js`), code, 'utf8', (err) => {
            if (err) {
              logger.error(err);
              const error = new Error("Skill persisted to database, but couldn't write it to disk.");
              error.skill = skillName;
              return reject(error);
            }

            logger.log(`\t... Reload skill.`);

            this.reloadSkill(skillName).then(() => {
              return resolve(skill.code_id);
            }).catch((err) => {
              const error = new Error("Skill saved, but couldn't be loaded because: " + err.message);
              error.skill = skillName;
              return reject(error);
            });
          });
        }).catch((err) => {
          logger.error(`\t... \x1b[31mFailed\x1b[0m for reason: ${err.message || "Unkown reason"}.`);
          if (err.code) {
            err.skill = skillName;
            return reject(err);
          }
          const error = new Error("Code is valid, but couldn't save it to database.");
          error.skill = skillName;
          return reject(error);
        });
      }).catch((err) => {
        err.skill = skillName;
        return reject(err);
      });
    });
  }

  /////////////////////////////////////////////////////////////
  // HANDLERS

  handleCommand(cmd, phrase = "", data = {}) {
    return Promise.resolve().then(() => {
      if (!this.hasCommand(cmd)) {
        throw new Error("Command is not active or undefined.");
      }

      return this.skills[this.commands[cmd].skill].commands[cmd].handler({ phrase, data });
    });
  }

  handleIntent(slug, entities = {}, data = {}) {
    return Promise.resolve().then(() => {
      if (!this.hasIntent(slug)) {
        throw new Error("Intent is not active or undefined.");
      }

      return this.skills[this.intents[slug].skill].intents[slug].handler({ entities, data });
    });
  }

  handleInteraction(name, thread, { phrase, data } = {}) {
    return Promise.resolve().then(() => {
      if (!this.hasInteraction(name)) {
        throw new Error("Interaction is not active or undefined.");
      }

      return this.skills[this.interactions[name].skill].interactions[name].handler(thread, { phrase, data });
    });
  }

  /////////////////////////////////////////////////////////////
  // HELP

  getHelpBySkills() {
    return Promise.resolve([...this.skills].map(skill => {
      const help = {
        name: skill.name,
        active: skill.active,
        commands: Object.values(skill.commands).map(command => {
          return {
            name: command.name,
            cmd: command.cmd,
            help: command.help
          };
        }),
        intents: Object.values(skill.intents).map(intent => {
          return {
            name: intent.name,
            slug: intent.slug,
            help: intent.help
          };
        })
      };
      if (skill.description && skill.description.length > 0) {
        help.description = skill.description;
      }
      return help;
    }));
  }
}
