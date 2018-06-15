'use strict';
const logger = new (require('./../../logic/components/Logger'))();

const fs = require('fs');
const path = require('path');

const skillTemplateRegex = fs.readFileSync(path.join(__dirname, "./skillCodeRegex.txt"), "utf8").trim();

const Skill = require('./Skill');

exports.SkillManager = class SkillManager {
  constructor(skillsDirectory) {
    this.skillController = require("./../../database/controllers/skillController");
    this.skillsDirectory = skillsDirectory;

    this.skills = {
      *[Symbol.iterator]() {
        yield* Object.entries(this);
      }
    };

    this.commands = {
      *[Symbol.iterator]() {
        yield* Object.entries(this);
      }
    };

    this.intents = {
      *[Symbol.iterator]() {
        yield* Object.entries(this);
      }
    };

    this.interactions = {
      *[Symbol.iterator]() {
        yield* Object.entries(this);
      }
    };

    this.pipes = {
      *[Symbol.iterator]() {
        yield* Object.entries(this);
      }
    }
  }

  ////////////////////////////
  // TODO: REFACTORED

  hasSkill(name) {
    return [...this.skills].includes(name);
  }

  /** Get a skill by name.
   * 
   * @param {String} name Name of the skill to get.
   * @return {Skill} Skill found (nullable).
   */
  getSkill(name) {
    return this.skills[name];
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
          return reject(new Error("Could not push skill code."));
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
      this.skills[skill.name] = skill;

      Object.values(skill.commands).forEach(command => {
        // Command are unique by their command word cmd. Force active to false.
        this.commands[command.cmd] = {
          skill: skill.name,
          active: false
        };
      });

      Object.values(skill.commands).forEach(intent => {
        // Intents are unique by their slug. Force active to false.
        this.intents[intent.slug] = {
          skill: skill.name,
          active: false
        };
      });
      
      Object.values(skill.interactions).forEach(interaction => {
        // Interactions are unique by their name. Force active to false.
        this.interactions[interaction.name] = {
          skill: skill.name,
          active: false
        };
      });

      Object.values(skill.pipes).forEach(pipe => {
        // Pipes are unique by their name. Force active to false.
        this.pipes[pipe.name] = {
          skill: skill.name,
          active: false
        };
      });

      return this.getSkill(skill.name);
    });
  }

  /** Delete a skill.
   * 
   * @param {String} name Name of the skill to delete.
   * @return {Promise} Promise to the deleted skill.
   */
  removeSkill(name) {
    return Promise.resolve().then(() => {
      delete this.skills[name];
      return true;
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
        // Skill instanceof Skill and validated, re-added with active: false.
        this.skills[name].active = true;

        // activate all components
        [...skill.commands].forEach(command => {
          this.commands[command.cmd].active = true;
        });

        [...skill.intents].forEach(intent => {
          this.intents[intent.slug].active = true;
        });

        [...skill.interactions].forEach(interaction => {
          this.interactions[interaction.name].active = true;
        });

        [...skill.pipes].forEach(pipe => {
          this.pipes[pipe.name].active = true;
        });

        logger.log(`\t\t... \x1b[32mactivated\x1b[0m`);
        return true;
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
      const skill = this.getSkill(skill);

      // Skill instanceof Skill and validated, re-added with active: false.
      this.skills[name].active = false;

      // activate all components
      [...skill.commands].forEach(command => {
        this.commands[command.cmd].active = false;
      });

      [...skill.intents].forEach(intent => {
        this.intents[intent.slug].active = false;
      });

      [...skill.interactions].forEach(interaction => {
        this.interactions[interaction.name].active = false;
      });

      [...skill.pipes].forEach(pipe => {
        this.pipes[pipe.name].active = false;
      });

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
  
  // TODO: TO REFACTOR
  ////////////////////////////

  /**
   *  Reload a specific skill. (Remove it, reload it, add it).
   * @param {String} skillName The name of the skill to reload.
   * @return {Promise} Promise object resolve if success, reject otherwise.
   */
  reloadSkill(skillName) {
    return new Promise((resolve, reject) => {
      if (this.skills.has(skillName)) {
        try {
          logger.info(`Reloading skill \x1b[33m${skillName}\x1b[0m...`);

          logger.log(`\tRemoving skill \x1b[33m${skillName}\x1b[0m...`);
          logger.log(`\tRemoving associated Intents...`);
          let skill = this.skills.get(skillName);
          if (skill.intents) {
            for (let intent in skill.intents) {
              logger.log("\t\tRemoving " + intent);
              this.intents.remove(skill.intents[intent].slug);
            }
          }

          logger.log(`\tRemoving linked Commands...`);
          if (skill.commands) {
            for (let command in skill.commands) {
              logger.log("\t\tRemoving " + command);
              this.commands.remove(command);
            }
          }

          logger.log(`\tRemoving linked Interactions...`);
          if (skill.interactions) {
            for (let interaction in skill.interactions) {
              logger.log("\t\tRemoving " + interaction);
              this.interactions.remove(interaction);
            }
          }

          logger.log(`\tRemoving skill...`);
          this.skills.remove(skillName);
          logger.info(`Skill \x1b[33m${skillName}\x1b[0m successfully removed.`);

          logger.info('Clearing cache for skill \x1b[33m${skillName}\x1b[0m');
          delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/skill`))];
          if (fs.existsSync(path.join(this.skillsDirectory, `/${skillName}/secret`))) {
            delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/secret`))];
          }

          this.loadSkill(skillName).then(() => {
            return resolve()
          }).catch((err) => {
            logger.error(err);
            return reject();
          });
        } catch (e) {
          logger.error(e.stack);
          return reject();
        }
      } else {
        reject();
      }
    });
  }

  /**
   * Load skill from /logic/skills folder.
   * @param {String} skillName The name of the skill to load.
   * @return {Promise} Promise object resolve if success, reject otherwise.
   */
  loadSkill(skillName) {
    return this.skillController.is_active(skillName).then(status => {
      logger.log(`\tLoading skill \x1b[33m${skillName}\x1b[0m...`);
      delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/skill`))];
      if (fs.existsSync(path.join(this.skillsDirectory, `/${skillName}/secret`))) {
        delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/secret`))];
      }
      this.skills.add(skillName, {});
      this.skills.get(skillName).active = false;
      let skill = require(path.join(this.skillsDirectory, `/${skillName}/skill`));
      this.skills.add(skillName, skill);

      for (let intentName in skill.intents) {
        let intent = skill.intents[intentName];
        intent.active = status;
        this.intents.add(intent.slug, intent);
      }

      for (let commandName in skill.commands) {
        let command = skill.commands[commandName];
        command.active = status;
        this.commands.add(command.cmd, command);
      }

      for (let interactionName in skill.interactions) {
        let interaction = skill.interactions[interactionName];
        interaction.active = status;
        this.interactions.add(interaction.name, interaction);
      }

      this.skills.get(skillName).active = status;
      logger.log(`\t..."${skillName}" successfully loaded`);
      logger.log(`\t\t... ${status ? `And \x1b[32mactivated\x1b[0m` : `But \x1b[31mnot activated\x1b[0m`}.`)
      return status;
    }).catch((err) => {
      logger.error(`\x1b[31m\t..."${skillName}" could not load!\x1b[0m`);
      logger.error(err);
      throw err;
    });
  }

  /**
   * Load skills from /logic/skills folder.
   * Store commands and intents into memory : skills, commands and intents.
   * @param {String[]} skillsToLoad The names of skills to load.
   */
  loadSkills(skillsToLoad) {
    logger.info(`Loading skills...`);
    let loaders = [];
    for (let skillName of skillsToLoad) {
      this.skills.add(skillName, {});
      loaders.push(
        this.skillController.is_active(skillName).then(status => {
          logger.log(`\tLoading skill "${skillName}"...`);
          delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/skill`))];
          if (fs.existsSync(path.join(this.skillsDirectory, `/${skillName}/secret`))) {
            delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/secret`))];
          }
          this.skills.get(skillName).active = false;
          let skill = require(path.join(this.skillsDirectory, `/${skillName}/skill`));
          this.skills.add(skillName, skill);

          for (let intentName in skill.intents) {
            let intent = skill.intents[intentName];
            intent.active = status;
            this.intents.add(intent.slug, intent);
          }

          for (let commandName in skill.commands) {
            let command = skill.commands[commandName];
            command.active = status;
            this.commands.add(command.cmd, command);
          }

          for (let interactionName in skill.interactions) {
            let interaction = skill.interactions[interactionName];
            interaction.active = status;
            this.interactions.add(interaction.name, interaction);
          }

        this.skills.get(skillName).active = status;
        logger.log(`\t..."${skillName}" successfully loaded`);
        logger.log(`\t\t... ${status ? `And \x1b[32mactivated\x1b[0m` : `But \x1b[31mnot activated\x1b[0m`}.`);
      }).catch(err => {
        logger.error(`\x1b[31m\t..."${skillName}" could not load!\x1b[0m`);
        logger.log(err);
      })
    );
    }

    Promise.all(loaders).then(() => {
      logger.log("               ");
      logger.info(`Loaded Skills: ${this.skills.list.join(", ")}`);
      logger.info(`Plugged Intents: ${this.intents.list.join(", ")}`);
      logger.info(`Available Commands: ${this.commands.list.join(", ")}`);
    })
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
   */
  loadSkillsFromFolder() {
    let skillsFolders;
    try {
      logger.info(` Loading skills directory: "\x1b[4m${"/skills"}\x1b[0m"...`);
      skillsFolders = this.getDirectories(this.skillsDirectory)
      logger.info(` Skills folders found: \x1b[33m${skillsFolders.join(", ")}\x1b[0m.`);
      this.skillController.get().then((skills_db) => {
        const skillsNameInDb = skills_db.map((skill => skill.name));
        const skillsToPersist = skillsFolders.filter(skillName => !skillsNameInDb.includes(skillName));
        const loaders = skillsToPersist.map((skill) => {
          return Promise.resolve().then(() => {
              return new Promise((resolve, reject) => {
                logger.log(`\t... Persist skill ${skill} in database...`);
                // Extract the skill code
                const skill_code = fs.readFileSync(this.skillsDirectory + "/" + skill + "/skill.js");
                // Extract the secret ( if it exist )
                var secret = {};
                if (fs.existsSync(this.skillsDirectory + "/" + skill + "/secret.js")) {
                  secret = require(this.skillsDirectory + "/" + skill + "/secret");
                }
                return resolve(this.skillController.create_skill(skill, skill_code, secret).then(() => {
                  logger.log(`\t... Persisted skill ${skill} in database...`);
                }));
              });
          });
        });

        logger.info(`Persist local skills in database...`);
        
        Promise.all(loaders).then(() => {
          if(loaders.length > 0) {
            logger.info("Inserted successfully new skills  " + skillsToPersist.join(',') + " from local to the database");
          } else {
            logger.info("No local skills to persist.");
          }
          /**
            Load skills on module require (bot start).
          */
          let skillsToLoad = skillsFolders;

          this.loadSkills(skillsToLoad);
        }).catch((err) => {
          logger.error(" Error inserting new skill from local dir to the database : " + err);
        });
      }).catch((err) => {
        logger.error(" Error retrieiving the skills from the database : " + err);
      });
    } catch (e) {
      logger.error(e.stack);
    }
  }

  /**
   * Get a skill's code.
   * @param {String} skillName - The name of the skill to get code of.
   * @return {Promise} Promise object represents the skill's code.
   */
  getSkillCode(skillName) {
    return new Promise((resolve, reject) => {
      if (this.skills.has(skillName)) {
        fs.readFile(path.join(this.skillsDirectory, `/${skillName}/skill.js`), 'utf8', (err, data) => {
          if (err) {
            logger.error(err.stack);
            return reject();
          }
          let code = data;
          return resolve(code);
        })
      } else {
        return reject();
      }
    });
  }

  /**
   * Save a skill's code before saving it.
   * @param {String} code - The code of the skill to validate.
   * @return {Promise} Promise object (true, null) if validated, (false, string reason) otherwise.
   */
  validateSkillCode(code) {
    return new Promise((resolve, reject) => {
      // TODO: Validate skill code.

      let [matched, name, author, date, commands, intents, interactions, dependencies, logic, ...rest] = new RegExp(skillTemplateRegex, "g").exec(code) || [null, null, null, null, null, null, null, null, null, null];
      if (matched == null || matched.length == 0) {
        return resolve(false, "Skill template didn't match.");
      }

      return resolve(true, null);
    });
  }

  /**
   * Save a skill's code.
   * @param {String} skillName - The name of the skill where to save code.
   * @param {String} code - The code of the skill to save.
   * @return {Promise} Promise object resolves if success, reject otherwise.
   */
  saveSkillCode(skillName, code) {
    return new Promise((resolve, reject) => {
      this.validateSkillCode(code).then((success, reason) => {
        // TODO: Validate skill code instead of TRUE...

        if (true) { // eslint-disable-line no-constant-condition
          logger.info(`Saving code of skill \x1b[33m${skillName}\x1b[0m...`);
          logger.log(`\t... Push ${skillName} to database...`);
          this.skillController.save_code(skillName, code).then((skill) => {
            logger.log(`\t... Writing code file of ${skillName}...`);
            fs.writeFile(path.join(this.skillsDirectory, `/${skillName}/skill.js`), code, 'utf8', (err) => {
              if (err) {
                logger.error(err);
                return reject();
              }

              logger.log(`\t... Reload skill.`);

              this.reloadSkill(skillName).then(() => {
                return resolve();
              }).catch((err) => {
                logger.error(err);
                return reject();
              });
            });
          }).catch((err) => {
            logger.error(`\t... \x1b[31mFailed\x1b[0m for reason: ${err.message || "Unkown reason"}.`);
            return reject(new Error("Could not push skill code."));
          });
        } else {
          return reject(new Error("Skill code is not valid : " + reason || ""));
        }
      }).catch((err) => {
        logger.error(err);
        return reject(new Error("Skill code is not valid."));
      });
    });
  }

  /**
   * Remove a skill.
   * @param {String} skillName - The name of the skill to remove.
   * @return {Promise} Promise object resolves if success, reject otherwise.
   */
  deleteSkill(skillName) {
    return new Promise((resolve, reject) => {
      logger.info(`Deleting skill \x1b[33m${skillName}\x1b[0m...`);

      logger.log(`\tRemoving skill \x1b[33m${skillName}\x1b[0m...`);
      logger.log(`\tRemoving associated Intents...`);
      let skill = this.skills.get(skillName);
      if (skill.intents) {
        for (let intent in skill.intents) {
          logger.log("\t\tRemoving " + intent);
          this.intents.remove(skill.intents[intent].slug);
        }
      }

      logger.log(`\tRemoving linked Commands...`);
      if (skill.commands) {
        for (let command in skill.commands) {
          logger.log("\t\tRemoving " + command);
          this.commands.remove(command);
        }
      }

      logger.log(`\tRemoving linked interactions...`);
      if (skill.interactions) {
        for (let interaction in skill.interactions) {
          logger.log("\t\tRemoving " + interaction);
          this.interactions.remove(interaction);
        }
      }

      logger.log(`\tRemoving skill...`);
      this.skills.remove(skillName);
      logger.info(`Skill \x1b[33m${skillName}\x1b[0m successfully removed.`);

      logger.info(`Clearing cache for skill \x1b[33m${skillName}\x1b[0m`);
      delete require.cache[require.resolve(path.join(this.skillsDirectory, `/${skillName}/skill`))];

      logger.info(`Removing skill \x1b[33m${skillName}\x1b[0m from database...`);
      this.skillController.delete(skillName).then(() => {
        logger.info(`Removing files for skill \x1b[33m${skillName}\x1b[0m...`);
        try {
          this.deleteFolderRecursive(path.join(this.skillsDirectory, "/" + skillName));
          logger.info(`Successfully removed folder ${"/skills/" + skillName}`);
          return resolve();
        } catch (e) {
          return reject({ message: "Could not delete folder " + "/skills/" + skillName });
        }
      }).catch(err => {
        logger.error(`\t... \x1b[31mFailed\x1b[0m for reason: ${err.message || "Unkown reason"}.`);
        return reject(new Error("Could not delete skill."));
      })
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
   * Get secrets for a skill.
   * @param {String} skillName - The name of the skill to get secret of.
   * @return {Promise} Promise to the secret array of key-value pair.
   */
  getSkillSecret(skillName) {
    return new Promise((resolve, reject) => {
      if (this.skills.has(skillName)) {
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
  updateSkillSecret(skillName, secrets) {
    return new Promise((resolve, reject) => {
      if (this.skills.has(skillName)) {
        let secret = {};
        for (let [key, value] of secrets) {
          if (key.length > 0) {
            // Don't retain empty keys.
            secret[key] = value;
          }
        }

        logger.info(`Saving secret of skill \x1b[33m${skillName}\x1b[0m...`);
        logger.log(`\t... Push ${skillName} secret to database...`);
        this.skillController.save_secret(skillName, secret).then(skill => {
          let filePath = path.join(this.skillsDirectory, `/${skillName}/secret.js`);
          // Using stream is the recommended method to edit files with potentiel concurrency.
          let stream = fs.createWriteStream(filePath);
          stream.on("error", (error) => {
            logger.error(error);
            return reject();
          });
          stream.on("finish", () => {
            logger.log(`\t... Reload skill.`);

            delete require.cache[require.resolve(filePath)];
            this.reloadSkill(skillName).then(() => {
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
        return reject({ code: 404, message: "No skill named " + skillName });
      }
    });
  }
}
