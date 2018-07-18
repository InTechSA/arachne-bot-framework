'use strict';
const express = require('express');
const hub = require('../logic/hub');
const path = require('path');
const users = require('../database/controllers/userController');
const logger = new (require('../logic/components/Logger'))();

module.exports = function(io) {
  let router = express.Router();

  // Dashboard Main Middleware
  router.use((req, res, next) => {
    next();
  });

  ///////////////////////////////////////////////////////////////////////////////
  //                      UNSECURED ENDPOINTS
  ///////////////////////////////////////////////////////////////////////////////

  router.use('/static', express.static(path.join(__dirname, './public')));

  // Login Page
  router.get('/login', (req, res) => {
    return res.render('login');
  });

  const authMiddleware = require('../middlewares/auth');

  // MIDDLEWARE FOR DASHBOARD AUTH
  router.use(authMiddleware.isAuthed());
  const hasRole = authMiddleware.hasRole;
  const hasPerm = authMiddleware.hasPerm;

  ///////////////////////////////////////////////////////////////////////////////
  //                      AUTHED ENDPOINTS
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Dashboard index

  router.get('/', hasPerm('ACCESS_DASHBOARD'), (req, res, next) => {
    hub.ConnectorManager.getConnectorByName("Dashboard").then((connector) => {
      hub.getSkills().then((skills) => {
        return res.render('index', {
          title: 'Dashboard - Bot',
          nav_link: 'nav-portal',
          message: 'Welcome to administration panel of this amazing Bot.',
          mainTitle: "Bot Brain Dashboard",
          botname: hub.ConfigurationManager.loadedConfiguration.botname,
          skills: skills.map(skill => {
            return {
              name: skill.name,
              commands: skill.commands,
              intents: skill.intents,
              active: skill.active
            }
          }),
          connector_token: connector.token
        });
      }).catch((err) => {
        return next(err);
      });
    }).catch((err) => {
      hub.getSkills().then((skills) => {
        res.render('index', {
          title: 'Dashboard - Bot',
          nav_link: 'nav-portal',
          message: 'Welcome to administration panel of this amazing Bot.',
          mainTitle: `${hub.ConfigurationManager.loadedConfiguration.botname} Dashboard`,
          botname: hub.ConfigurationManager.loadedConfiguration.botname,
          skills: skills.map(skill => {
            return {
              name: skill.name,
              commands: skill.commands,
              intents: skill.intents,
              active: skill.active
            }
          }),
          connector_token: ""
        });
      }).catch((err) => {
        return next(err);
      });
    })
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Dashboard Skills administration

  router.get('/skills', hasPerm('SEE_SKILLS'), (req, res) => {
    hub.getSkills().then((skills) => {
      res.render('skills', {
        title: 'Skills - Bot',
        nav_link: 'nav-skills',
        message: 'Welcome to administration panel of this amazing Bot.',
        mainTitle: `${hub.ConfigurationManager.loadedConfiguration.botname} Dashboard`,
        botname: hub.ConfigurationManager.loadedConfiguration.botname,
        skills: skills.map(skill => {
          return {
            name: skill.name,
            commands: skill.commands,
            intents: skill.intents,
            active: skill.active
          }
        }),
      });
    });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Dashboard Skills administration

  router.get('/skills/new', hasPerm('CREATE_SKILL'), (req, res) => {
    res.render('skill_edit', {
      title: 'Add Skill - Bot',
      nav_link: 'nav-skills',
      botname: hub.ConfigurationManager.loadedConfiguration.botname
    });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Skill Monitoring

  router.get('/skills/:skill', hasPerm('MONITOR_SKILL'), (req, res, next) => {
    hub.getSkill(req.params.skill).then((skillFound) => {
      if (skillFound) {
        let skill = Object.assign({}, skillFound);
        skill.name = req.params.skill;
        Promise.all([
          hub.HookManager.getForSkill(req.params.skill),
          hub.StorageManager.getForSkill(req.params.skill), 
          hub.PipeManager.getForSkill(req.params.skill),
          hub.LogManager.logController.getOne(req.params.skill)
        ]).then(([ hooks, storage, pipes, logs ]) => {
          skill.hooks = hooks;
          skill.storage = storage;
          skill.pipes = pipes;
          skill.logs = logs.log;

          res.render('skill', {
            title: skill.name,
            nav_link: 'nav-skills',
            botname: hub.ConfigurationManager.loadedConfiguration.botname,
            skill
          });
        }).catch((err) => {
          logger.error(err);
          return next({ code: 500 });
        });
      } else {
        res.render('skill', {
          title: 'Skill not found',
          nav_link: 'nav-skills',
          botname: hub.ConfigurationManager.loadedConfiguration.botname
        });
      }
    }).catch((err) => {
      next(err);
    });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Dashboard Skills administration

  router.get('/skills/:skill/edit', hasPerm('EDIT_SKILL'), (req, res) => {
    hub.getSkill(req.params.skill).then((skill) => {
      if (skill) {
        hub.getSkillCode(req.params.skill).then((code) => {
          res.render('skill_edit', {
            title: 'Edit Skill ' + req.params.skill + ' - Bot',
            nav_link: 'nav-skills',
            botname: hub.ConfigurationManager.loadedConfiguration.botname,
            skill_edited: {
              name: req.params.skill,
              code: code.code,
              codeid: code.code_id,
              intents: skill.intents ? skill.intents.intents : [],
              commands: skill.commands ? skill.commands.commands : [],
              active: skill.active
            }
          });
        }).catch((err) => {
          logger.error(err);
          res.redirect('/dashboard/skills');
        });
      } else {
        res.redirect('/dashboard/skills');
      }
    });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Connectors administration

  router.get('/connectors', hasPerm('SEE_ADAPTERS'), (req, res, next) => {
    hub.ConnectorManager.getConnectors()
      .then((connectors) => {
        res.render('connectors', {
          title: 'Manage Connectors',
          nav_link: 'nav-connectors',
          botname: hub.ConfigurationManager.loadedConfiguration.botname,
          connectors
        })
      })
      .catch((err) => {
        return next(err);
      });
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Manage Users

  router.get('/users', hasPerm("SEE_USERS"), (req, res, next) => {
    Promise.all([hub.UserManager.getAll(), hub.PermissionManager.getRoles()]).then(([users, roles]) => {
      return res.render("users", {
        title: 'Manage Users',
        nav_link: 'nav-users',
        botname: hub.ConfigurationManager.loadedConfiguration.botname,
        permissions: hub.PermissionManager.permissions,
        users,
        roles
      });
    }).catch(next);
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Cofnigure Brain

  router.get('/configuration', hasRole("SEE_CONFIGURATION"), (req, res, next) => {
    // Load configuration stored in database (it may be different from the currently loaded configuration!)
    hub.ConfigurationManager.getConfiguration().then(configuration => {
      return res.render("config", {
        title: 'Configure brain',
        nav_link: 'nav-configuration',
        botname: hub.ConfigurationManager.loadedConfiguration.botname,
        configuration: configuration.confList,
        loaded_configuration: hub.ConfigurationManager.loadedConfiguration
      });
    }).catch(next);
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // User account settings

  router.get('/settings', (req, res, next) => {
    if (process.env.USE_AUTH_SERVIce) {
      return res.render('settings', {
        title: "Dashboard Settings - Bot",
        nav_link: 'settings',
        botname: hub.ConfigurationManager.loadedConfiguration.botname,
        managed_by_AD: true
      });
    }
    users.get_user(req.decoded.user.id).then((user) => {
      return res.render('settings', {
        title: "Dashboard Settings - Bot",
        nav_link: 'settings',
        botname: hub.ConfigurationManager.loadedConfiguration.botname,
        user: user
      });
    }).catch((err) => {
      return next();
    })
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Modify username

  router.put('/settings/username', (req, res) => {
    if (process.env.USE_AUTH_SERVICE) {
      return res.status(403).json({
        success: false,
        message: "Accounts are managed by an external authentication service."
      });
    }
    let usernameRegex = /^[0-9a-zA-Z\u00E0-\u00FC -_]{3,30}$/;
    if (req.body.username && usernameRegex.test(req.body.username)) {
      users.update_username(req.decoded.user.id, req.body.username).then(() => {
        return res.status(200).json({ success: true, message: "Username updated." });
      }).catch((err) => {
        if (err.error) {
          return res.status(400).json({ success: false, message: "Username already in use." });
        } else {
          return res.status(500).json({ success: false, message: "Error while setting username." });
        }
      });
    } else {
      return res.status(400).json({ success: false, message: "Username must contains only letters (accentued), digits, '-', '_', and whitespaces, from 3 to 30 characters." });
    }
  });

  //
  ///////////////////////////////////////////////////////////////////////////////

  ///////////////////////////////////////////////////////////////////////////////
  // Modify password

  router.put('/settings/password', (req, res) => {
    if (process.env.USE_AUTH_SERVICE) {
      return res.status(403).json({
        success: false,
        message: "Accounts are managed by an external authentication service."
      });
    }
    
    if (!req.body.current_password) {
      return res.status(400).json({ sucess: false, message: "No current password to confirm security operation." });
    }

    let passwordRegex = /^[0-9a-zA-Z\u00E0-\u00FC!@#{}~"'\(\[|\\^=+\]\)-_]{8,30}$/; // eslint-disable-line no-useless-escape
    if (req.body.new_password && passwordRegex.test(req.body.new_password)) {
      users.update_password(req.decoded.user.id, req.body.current_password, req.body.new_password).then(() => {
        return res.status(200).json({ success: true, message: "Password updated." });
      }).catch((err) => {
        if (err.error) {
          return res.status(400).json({ success: false, message: err.message });
        } else {
          return res.status(500).json({ success: false, message: "Error while setting password." });
        }
      });
    } else {
      return res.status(400).json({ success: false, message: "new_password must contains only letters, digits, some special characters, from 8 to 30 characters." });
    }
  });
  
  //
  ///////////////////////////////////////////////////////////////////////////////

  // Dashboard 404 Error
  router.get('*', (req, res) => {
    res.status(404).render('error', { code: 404, message: "404 Error : Page Not Found." });
  });

  // Dashboard error handling (logging)
  router.use((err, req, res, next) => {
    if (err.code == 403) {
      if (err.no_token) {
        return res.redirect('/dashboard/login');
      } else {
        return res.render('error', {
          title: "Access denied",
          code: 403
        });
      }
    }
    logger.error(err);
    res.status(500).render('error', { code: 500, message: "500 Error: Internal Server Error." })
  });

  return router;
};
