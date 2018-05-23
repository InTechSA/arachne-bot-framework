'use strict';
const express = require('express');
const botRouter = require('./botRouter');
let hub = require('./logic/hub');
const users = require('./database/controllers/userController');

// Main router for the brain. Will load te dashboard router and the bot router.
module.exports = function(io) {
  let router = express.Router();

  // Main middleware
  router.use((req, res, next) => {
    next();
  });

  ///////////////////////////////////////////////////////////////////////////////
  //                      UNSECURED ENDPOINTS
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////

  // Bot Brain main endpoint
  router.get('/', (req, res) => {
    res.json({ success: true, message: 'Entry of Bot Brain Interface API. /dashboard for admin interface, /nlp for a natural language conversation post, /command for a command post.' });
  });

  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Login endpoint

  /**
   * @api {post} /login Login to dashboard
   * @apiName Login
   * @apiGroup Login
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   * @apiSuccess {String} token User token for this session.
   */
  router.post('/login', (req, res) => {
    users.sign_in(req.body.user_name.trim(), req.body.password.trim()).then((obj) => {
      return res.json({ success: true, message: obj.message, token: obj.token });
    }).catch((err) => {
      if (err.message) {
        return res.status(err.code || 400).json({ success: false, message: err.message });
      }
      console.log(err.stack);
      return res.status(500).json({ success: false, message: "Unkown error." });
    });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // API DOC

  /**
   * @api {post} /apidoc.yml Get OpenApi definition.
   * @apiName ApiDef
   * @apiGroup Admin
   * @apiSuccess {File} apidoc.yml OpenAPI definition
   */
  router.get('/apidoc.yml', (req, res, next) => {
    res.sendFile("apidoc.yml", {
        root: __dirname + "/public/",
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    }, (err) => {
        if (err) {
            return next(err);
        }
    });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Setup for admin account. Will be ignored if there is at least one user in the database.

  /**
   * @api {get} /setup Setup admin account.
   * @apiName SetupAdmin
   * @apiGroup Setup
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   */
  router.get('/setup', (err, res) => {
    users.is_empty().then((isempty) => {
      if (isempty) {
        users.create_user({ user_name: process.env.ADMIN_USER.trim() || "Nakasar", password: "Password0", roles: ["admin"] }).then((obj) => {
          users.promote_user(obj.id, "admin").then((user) => {
            return res.json({ success: true, message: "Admin user added.", user: { id: user._id, roles: user.roles, user_name: user.user_name } });
          }).catch((err) => {
            console.log(err);
            return res.status(500).json({ success: false, message: "Could not setup admin user." });
          });
        }).catch((err) => {
          console.log(err);
          return res.status(500).json({ success: false, message: "Could not setup admin user." });
        });
      } else {
        return res.status(403).json({ success: false, message: "The user database is not empty." });
      }
    }).catch((err) => {
      console.log(err);
      return res.status(500).json({ success: false, message: "Could not setup admin user." });
    });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // DASHBOARD ENDPOINTS

  // Routing dashboard requests
  router.use('/dashboard', require('./dashboard/router')(io));

  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  //                      AUTHED ENDPOINTS
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // BOT ENDPOINTS

  router.use(botRouter(io));

  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // BOT ADMIN ENDPOINTS

  // MIDDLEWARE FOR BOT ADMIN AUTH
  const authMiddleware = require('./middlewares/auth');
  router.use(authMiddleware.isAuthed());
  const hasRole = authMiddleware.hasRole;
  const hasPerm = authMiddleware.hasPerm;

  // Reload brain
  /**
   * @api {post} /reload Reload brain.
   * @apiName ReloadBrain
   * @apiGroup Brain
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   */
  router.post('/reload', hasPerm('RELOAD_BRAIN'), (req, res) => {
    hub.reloadBrain().then(() => {
      return res.json({ success: true, message: "Successfully reloaded brain." });
    }).catch((err) => {
      console.log(err.stack);
      return res.json({ success: false, message: "An unkown error occured while reloading brain." });
    });
  }),

  // list skills
  /**
   * @api {get} /skills List skills avaible.
   * @apiName ListSkills
   * @apiGroup Skills
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   * @apiSuccess {Skill} skills List of available skills.
   */
  router.get('/skills', hasPerm('SEE_SKILLS'), (req, res) => {
    hub.getSkills().then((skills) => {
      let skillsToReturn = JSON.parse(JSON.stringify(skills));

      // Be sure to send handle and execute names instead of function object
      for (let skill in skills) {
        for (let intentName in skillsToReturn[skill].intents) {
          skillsToReturn[skill].intents[intentName].handle = `${skills[skill].intents[intentName].handle.name}`;
        }
        for (let commandName in skillsToReturn[skill].commands) {
          skillsToReturn[skill].commands[commandName].execute = `${skills[skill].commands[commandName].execute.name}`;
        }
        for (let interactionName in skillsToReturn[skill].interactions) {
          skillsToReturn[skill].interactions[interactionName].interact = `${skills[skill].interactions[interactionName].interact.name}`;
        }
      }

      return res.json({ success: true, message: 'Got list of bot skills.', skills: skillsToReturn });
    });
  });

  // Add a new skill
  /**
   * @api {put} /skills Add a new skill.
   * @apiName AddSkill
   * @apiGroup Skills
   *
   * @apiParam {String} skill_name Name of the new skill.
   * @apiParam {String} skill_code Code of the new skill.
   * @apiParam {Object} [skill_secret] - Secrets for this skill.
   * @apiParam {String} [skill_secret[].key] - The key of a secret.
   * @apiParam {String} [skill_secret[].value] - The value of a secret.
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   */
  router.put('/skills', hasPerm('CREATE_SKILL'), (req, res) => {
    if (!req.body.skill_name) {
      return res.json({ success: false, message: "Missing 'skill_name' definition in body." });
    }
    if (!req.body.skill_code) {
      return res.json({ success: false, message: "Missing 'skill_code' definition in body." });
    }
    let skill = { name: req.body.skill_name, code: req.body.skill_code };
    if (req.body.skill_secret) {
      skill.secret = req.body.skill_secret;
    }

    hub.addSkill(skill).then(() => {
      hub.loadSkill(skill.name).then(() => {
        return res.json({ success: true, message: "Skill added and loaded." });
      }).catch((err) => {
        return res.json({ success: true, message: "Skill added but not loaded (an error occured)." });
      });
    }).catch((err) => {
      if (err.message) {
        return res.json({ success: false, message: err.message });
      } else {
        console.log(err.stack);
        return res.json({ success: false, message: "An unkown error occured while saving new skill." });
      }
    });
  });

  // Delete a skill
  /**
   * @api {delete} /skills/:skill Delete a skill.
   * @apiName DeleteSkill
   * @apiGroup Skills
   *
   * @apiParam {String} skill Name of the skill to delete.
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   */
   router.delete('/skills/:skill', hasPerm('DELETE_SKILL'), (req, res) => {
     hub.deleteSkill(req.params.skill).then(() => {
       return res.json({ success: true, message: "Successfully deleted skill." });
     }).catch((err) => {
       console.log(err.stack);
       return res.json({ success: false, message: "An unkown error occured while deleting skill." });
     });
   });

  // Reload skills.
  /**
   * @api {post} /skills/:skill/reload Reload the skill.
   * @apiName ReloadSkill
   * @apiGroup Skills
   *
   * @apiParam {String} skill The name of the skill to reload.
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   */
  router.post('/skills/:skill/reload', hasPerm('RELOAD_SKILL'), (req, res) => {
    if (hub.hasSkill(req.params.skill)) {
      hub.reloadSkill(req.params.skill).then(() => {
        return res.json({ success: true, message: `Skill ${req.params.skill} reloaded.`})
      }).catch((err) => {
        return res.status(500).json({ success: false, message: `Could not reload Skill ${req.params.skill}.`})
      });
    } else {
      return res.status(404).json({ success: false, message: `Skill ${req.params.skill} does not exists.`});
    }
  });

  // Get skill code
  /**
   * @api {get} /skills/:skill/reload Get the code of the skill.
   * @apiName GetSkillCode
   * @apiGroup Skills
   *
   * @apiParam {String} skill The name of the skill to get code of.
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   * @apiSuccess {String} code Code of the skill.
   */
  router.get('/skills/:skill/edit', hasPerm('SEE_SKILL_CODE'), (req, res) => {
    if (hub.hasSkill(req.params.skill)) {
      hub.getSkillCode(req.params.skill).then((code) => {
        return res.json({ success: true, message: `Code of Skill ${req.params.skill} retrieved.`, code: code })
      }).catch(() => {
        return res.json({ success: false, message: `Could not get code of Skill ${req.params.skill}.`})
      });
    } else {
      return res.json({ success: false, message: `Skill ${req.params.skill} does not exists.`});
    }
  });

  // Update skill code
  /**
   * @api {put} /skills/:skill/code Update the skill.
   * @apiName UpdateSkill
   * @apiGroup Skills
   *
   * @apiParam {String} skill The name of the skill to update.
   * @apiParam {String} code The new code of the skill.
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   */
  router.put('/skills/:skill/code', hasPerm('EDIT_SKILL_CODE'), (req, res) => {
    if (!req.body.code) {
      return res.json({ success: false, message: "Missing 'code' definition in body." });
    }

    if (hub.hasSkill(req.params.skill)) {
      hub.saveSkillCode(req.params.skill, req.body.code).then(() => {
        return res.json({ success: true, message: `Code of Skill ${req.params.skill} saved, skill reloaded successfully.` })
      }).catch((err) => {
        return res.json({ success: false, message: `Could not save code of Skill ${req.params.skill}.`})
      });
    } else {
      return res.json({ success: false, message: `Skill ${req.params.skill} does not exists.`});
    }
  });

  // Get skill secrets
  /**
   * @api {put} /skills/:skill/secret Update the skill.
   * @apiName UpdateSkill
   * @apiGroup Skills
   *
   * @apiParam {String} skill The name of the skill to update.
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   * @apiSuccess {Object} [skill_secret] - Secrets for this skill.
   * @apiSuccess {String} [skill_secret[].key] - The key of a secret.
   * @apiSuccess {String} [skill_secret[].value] - The value of a secret.
   */
   router.get('/skills/:skill/secret', hasPerm('SEE_SKILL_SECRET'), (req, res) => {
     hub.getSkillSecret(req.params.skill).then((secret) => {
       if (secret) {
         return res.json({ success: true, secret: secret });
       } else {
         return res.status(404).json({ code: 404, message: "No skill named " + req.params.skill });
       }
     });
   });

  // Update skill secrets
  /**
   * @api {put} /skills/:skill/secret Update the skill.
   * @apiName UpdateSkill
   * @apiGroup Skills
   *
   * @apiParam {String} skill The name of the skill to update.
   * @apiParam {Object} [skill_secret] - Secrets for this skill.
   * @apiParam {String} skill_secret[].key - The key of a secret.
   * @apiParam {String} skill_secret[].value - The value of a secret.
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   */
  router.put('/skills/:skill/secret', hasPerm('EDIT_SKILL_SECRET'), (req, res) => {
    let secret;
    try {
      secret = JSON.parse(req.body.secret);
    } catch(e) {
      return res.status(400).json({ code: 400, message: `No valid secret in body : secret: [ [key, value] ]` });
    }

    if (!secret || !Array.isArray(secret)) {
      return res.status(400).json({ code: 400, message: `No valid secret in body : secret: [ [key, value] ]` });
    }

    hub.updateSkillSecret(req.params.skill, secret).then(() => {
      return res.json({ success: true, message: `Secret saved and skill reloaded.` });
    }).catch((e) => {
      console.log(e);
      return res.status(e.code || 500).json({ code: e.code || 500, message: e.message || "Internal server error while updating skill secret."});
    });

  });

  // Activate/Deactivate skills.
  /**
   * @api {post} /skills/:skill/:status Activate/Deactive a skill.
   * @apiName StatusSkill
   * @apiGroup Skills
   *
   * @apiParam {String} skill The name of the skill to update.
   * @apiParam {String} status "on" or "off".
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from api.
   * @apiSuccess {Boolean} active true if the skill is active, false otherwise.
   */
  router.post('/skills/:skill/:status', hasPerm('TOGGLE_SKILLS'), (req, res) => {
    // TODO: move activation/deactivation in a function exposed by hub!
    if (hub.hasSkill(req.params.skill)) {
      if (req.params.status === "on") {
        hub.activateSkill(req.params.skill).then(() => {
          return res.json({ success: true, message: `Skill ${req.params.skill} activated.`, active: true });
        }).catch((err) => {
          return res.json({ success: false, message: "Could not activate skill." });
        });
      } else if (req.params.status === "off") {
        hub.deactivateSkill(req.params.skill);
        return res.json({ success: true, message: `Skill ${req.params.skill} deactivated.`, active: false });
      } else {
        return res.json({ success: false, message: `Wrong status code : on or off.`});
      }
    } else {
      return res.json({ success: false, message: `Skill ${req.params.skill} does not exists.`});
    }
  });

  router.delete('/skills/:skill/hooks', hasPerm('DELETE_SKILL_HOOKS'), (req, res) => {
    if (hub.hasSkill(req.params.skill)) {
      hub.HookManager.clearForSkill(req.params.skill).then(() => {
        return res.json({ success: true, message: `Hooks cleared for skill ${req.params.skill}.`});  
      }).catch((err) => {
        console.log(err);
        return res.status(500).json({ success: false, message: `Could not clear hooks of skill ${req.params.skill}.`});  
      });
    } else {
      return res.json({ success: false, message: `Skill ${req.params.skill} does not exists.`});
    }
  });

  router.delete('/skills/:skill/storage', hasPerm('DELETE_SKILL_STORAGE'), (req, res) => {
    if (hub.hasSkill(req.params.skill)) {
      hub.StorageManager.clearForSkill(req.params.skill).then(() => {
        return res.json({ success: true, message: `Storage cleared for skill ${req.params.skill}.`});  
      }).catch((err) => {
        console.log(err);
        return res.status(500).json({ success: false, message: `Could not clear storage of skill ${req.params.skill}.`});  
      });
    } else {
      return res.json({ success: false, message: `Skill ${req.params.skill} does not exists.`});
    }
  });

  // Get list of connectors (without token)
  /**
   * @api {get} /connectors Get list of connectors registered for this bot, and their status.
   * @apiName ListConnectors
   * @apiGroup Connectors
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {Object} [connectors] List of connectors registered.
   * @apiSuccess {String} [connectors[]._id] - The unique id of a connector.
   * @apiSuccess {String} [connectors[].name] - The name of a connector.
   * @apiSuccess {Boolean} [connectors[].active] - The status of a connector.
   */
  router.get('/connectors', hasPerm('SEE_ADAPTERS'), (req, res) => {
    hub.ConnectorManager.getConnectors()
      .then((connectors) => res.json({
          success: true,
          connectors
        }))
      .catch((err) => res.status(err.code || 500).json({ error: 500, message: 'Internal server error while retrieving connectors list.' }));
  });

  // Get connector details (including token).
  /**
   * @api {get} /connectors/:id Get details about the specified connector.
   * @apiName DetailConnectors
   * @apiGroup Connectors
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {Object} connector The connector object.
   * @apiSuccess {String} connector._id - The unique id of a connector.
   * @apiSuccess {String} connector.name - The name of a connector.
   * @apiSuccess {Boolean} connector.active - The status of a connector.
   * @apiSuccess {String} connector.token - The auth token of a connector.
   */
  router.get('/connectors/:id', hasPerm('SEE_ADAPTER_TOKEN'), (req, res) => {
    hub.ConnectorManager.getConnector(req.params.id)
      .then((connector) => res.json({ success: true, connector: connector }))
      .catch((error) => res.status(error.code || 500).json({ error: error.code || 500, message: error.message || 'Internal server error while fetching connector '+req.params.id }));
  });

  // Delete connector.
  /**
   * @api {delete} /connectors/:id Delete the specified connector.
   * @apiName DeleteConnectors
   * @apiGroup Connectors
   *
   * @apiParam {String} id The id of the connector
   *
   * @apiSuccess {Boolean} success Success of operation.
   */
  router.delete('/connectors/:id', hasPerm('DELETE_ADAPTER'), (req, res) => {
    hub.ConnectorManager.deleteConnector(req.params.id)
      .then(() => res.json({ success: true, message: "Connector " + req.params.id + "successfully removed." }))
      .catch((error) => res.status(error.code || 500).json({ error: error.code || 500, message: error.message || 'Internal server error while fetching connector '+req.params.id }));
  });

  // Add connector.
  /**
   * @api {delete} /connectors Create a new connector.
   * @apiName DeleteConnectors
   * @apiGroup Connectors
   *
   * @apiParam {String} name The name of the connector to create.
   * @apiParam {String} [address] The ip address of the connector to create (if not given, token will be valid from any source).
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {Object} connector The connector object.
   * @apiSuccess {String} connector._id - The unique id of a connector.
   * @apiSuccess {String} connector.name - The name of a connector.
   * @apiSuccess {Boolean} connector.active - The status of a connector.
   * @apiSuccess {String} connector.token - The auth token of a connector.
   */
  router.put('/connectors', hasPerm('CREATE_ADAPTER'), (req, res) => {
    if (!req.body.name) {
      return res.status(400).json({ success: false, message: "No connector name in body."});
    }
    if (!/^[a-zA-Z\u00C0-\u017F\-'_]{3,30}$/.test(req.body.name)) {
      return res.status(400).json({ success: false, message: "Connector name container letters, digits, spaces and no special characters (max length: 30)."});
    }
    if (req.body.address && !/^(?:\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$/.test(req.body.address)) {
      return res.status(400).json({ success: false, message: "Invalid ip address"});
    }

    hub.ConnectorManager.createConnector(req.body.name, req.body.address || "")
      .then((connector) => res.json({ success: true, message: "Connector successfully created.", connector: connector }))
      .catch((error) => res.status(error.code || 500).json({ error: error.code || 500, message: error.message || 'Internal server error while creating connector' }));
  });

  // Modify connector.
  /**
   * @api {put} /connectors/:id Modifify a connector.
   * @apiName UpdateConnectors
   * @apiGroup Connectors
   *
   * @apiParam {String} id The id of the connector to update.
   * @apiParam {String} [address] The ip address of the connector to update (if not given, token will be valid from any source).
   *
   * @apiSuccess {Boolean} success Success of operation..
   */
  router.put('/connectors/:id', hasPerm('EDIT_ADAPTER'), (req, res) => {
    if (!req.body.address || !/^(?:\d{1,3}\.){3}\d{1,3}(:\d{1,5})?$/.test(req.body.address)) {
      return res.status(400).json({ success: false, message: "Invalid or missing ip address in body."});
    }

    hub.ConnectorManager.updateConnector(req.params.id, { ip: req.body.address })
    .then((connector) => res.json({ success: true, message: "Connector successfully updated.", connector: connector }))
    .catch((error) => res.status(error.code || 500).json({ error: error.code || 500, message: error.message || 'Internal server error while creating connector' }));
  });

  // Toggle adapter.
  /**
   * @api {post} /connectors/:id/toggle/:status Activate or deactivate the connector.
   * @apiName ToggleConnector
   * @apiGroup Connectors
   *
   * @apiParam {String} id The id of the connector.
   * @apiParam {String} status "on" or "off" (default).
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {Object} connector The connector object.
   * @apiSuccess {String} connector._id - The unique id of a connector.
   * @apiSuccess {String} connector.name - The name of a connector.
   * @apiSuccess {Boolean} connector.active - The status of a connector.
   */
  router.post('/connectors/:id/toggle/:status', hasPerm('TOGGLE_ADAPTER'), (req, res) => {
    hub.ConnectorManager.toggleConnector(req.params.id, req.params.status === "on" ? true : false)
      .then((connector) => res.json({ success: true, connector: connector }))
      .catch((err) => {
        console.log(err);
        res.status(err.code || 500).json({ error: err.code || 500, message: err.message || "Internal server error while setting connector status." })
      });
  });

  // Regenerate connector token
  /**
   * @api {post} /connectors/:id/token Regenerate token for the specified connector.
   * @apiName RefreshConnectorToken
   * @apiGroup Connectors
   *
   * @apiParam {String} id The id of the connector
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {Object} connector The connector object.
   * @apiSuccess {String} connector._id - The unique id of a connector.
   * @apiSuccess {String} connector.name - The name of a connector.
   * @apiSuccess {Boolean} connector.active - The status of a connector.
   * @apiSuccess {String} connector.token - The new auth token of a connector.
   */
  router.post('/connectors/:id/token', hasPerm('REFRESH_ADAPTER_TOKEN'), (req, res) => {
    hub.ConnectorManager.regenerateConnectorToken(req.params.id)
      .then((connector) => res.json({ success: true, connector: connector }))
      .catch((err) => res.status(err.code || 500).json({ error: err.code || 500, message: err.message || "Internal server error while refreshing connector token." }));
  });

  // Clear storage
  /**
   * @api {delete} /storage Full clear the bot storage.
   * @apiName ClearStorage
   * @apiGroup Storage
   *
   * @apiSuccess {Boolean} success Success of operation.
   * @apiSuccess {String} message Message from the api.
   */
  router.delete('/storage', hasPerm('CLEAR_STORAGE'), (req, res) => {
    hub.StorageManager.clear()
      .then(() => res.json({ success: true, message: "Storage fully cleared." }))
      .catch((err) => res.status(500).json({ error: 500, message: "Couldn't clear storage." }));
  });

  // Get users
  /**
   * @api {get} /users Get list of users.
   * @apiName GetUsers
   * @apiGroup Users
   * 
   * @apiSuccess {Boolean} success success of operation.
   * @apiSuccess {String} message Message from the api.
   * @apiSuccess {Object} [users] List of users
   * @apiSuccess {String} [users[].user_name] Username of a user.
   * @apiSuccess {Array} [users[].roles] Roles of a user.
   * @apiSuccess {String} [users[].roles[]] A role of a user's roles.
   * @apiSuccess {Array} [users[].permissions] Permissions of a user.
   * @apiSuccess {String} [users[].permissions[]] A permission of a user's permissions.
   */
  router.get('/users', hasPerm('SEE_USERS'), (req, res, next) => {
    hub.UserManager.userHasPermissions(req.decoded.user.id, ['SEE_USER_PERM', 'SEE_USER_LAST_CONNECT']).then(permissions => {
      return hub.UserManager.getAll().then(users => {
        users = users.map(user => {
          let display = {
            id: user._id,
            user_name: user.user_name,
            roles: user.roles,
            registered_date: user.registered_date
          };
          if (permissions['SEE_USER_PERM']) {
            display.permissions = user.permissions;
          }
          if (permissions['SEE_USER_LAST_CONNECT']) {
            display.last_connect = user.last_connect;
          }
          return display;
        });
        return res.json({ success: true, message: "List of users.", users });
      });
    }).catch(next);
  });

  // Get user
  router.get('/users/:user_name', (req, res, next) => {
    hub.UserManager.userHasPermissions(req.decoded.user.id, ['SEE_USERS', 'SEE_USER_PERM', 'SEE_USER_LAST_CONNECT']).then(permissions => {
      // A user should be able to access his/her own informations.
      const self = req.decoded.user.user_name === req.params.user_name.toLowerCase();
      if (!permissions['SEE_USERS'] && !self) {
        let error = new Error("No SEE_USERS permission.");
        error.code = 403;
        return next(error);
      }
      return hub.UserManager.getByUsername(req.params.user_name.toLowerCase()).then(user => {
        if (!user) {
          return res.status(404).json({ success: true, status: 404, message: "No user found." });
        }
        let display = {
          id: user._id,
          user_name: user.user_name,
          roles: user.roles,
          registered_date: user.registered_date
        };
        if (self || permissions['SEE_USER_PERM']) {
          display.permissions = user.permissions;
        }
        if (self || permissions['SEE_USER_LAST_CONNECT']) {
          display.last_connect = user.last_connect;
        }
        return res.json({ success: true, message: "List of users.", display });
      });
    }).catch(next);
  });

  // Create user
  router.post('/users', hasPerm('CREATE_USER'), (req, res, next) => {
    const user_name = req.body.user_name;
    const password = req.body.password;
    hub.UserManager.create(user_name, password).then(user => {
      return res.json({ success: true, message: "User created.", user: { id: user._id, user_name: user.user_name, roles: user.roles, permissions: user.permissions, }})
    }).catch(next);
  });

  // Delete user
  router.delete('/users/:user_name', hasPerm('DELETE_USER'), (req, res, next) => {
    hub.UserManager.delete(req.params.user_name, req.decoded.user.roles && req.decoded.user.roles.includes('admin')).then(() => {
      return res.json({ success: true, message: "User deleted." });
    }).catch(next);
  });

  // Get user roles
  router.get('/users/:user_name/roles', (req, res, next) => {
    return res.sendStatus(500);
  });

  // Get some informations about the bearer of the token.
  router.get('/me', (req, res, next) => {
    return res.sendStatus(500);
  });

  // Get permissions of the bearer of the token.
  router.get('/me/permissions', (req, res, next) => {
    return res.sendStatus(500);
  });

  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // ERRORS

  // 404 Error
  router.get('*', (req, res) => {
    res.status(404).json({ success: false, status: 404, message: 'Endpoint not found.' });
  });

  // Error handling (logging)
  router.use((err, req, res, next) => {
    if (err.code == 403) {
      return res.status(403).json({ success: false, status: 403, message: "Access denied." });
    } else if (err.code) {
      return res.status(err.code || 500).json({ success: false, status: err.code || 500, message: err.message || "Internal server error." });
    }
    console.log(err)
    res.status(500).json({ success: false, status: 500, message: 'Internal Server Error.' });
  });

  ///////////////////////////////////////////////////////////////////////////////

  return router;
}
