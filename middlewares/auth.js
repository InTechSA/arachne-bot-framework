const jwt = require('jsonwebtoken');
const config = require('../secret');
const Users = require('../database/controllers/userController');

// MIDDLEWARE FOR ADMIN
module.exports.hasRole = (role) => {
    return function(req, res, next) {
      if (!req.decoded)  {
        const error = new Error("Not logged in. Invalid token.");
        error.code = 403;
        error.no_token = true;
        return next(error);
      }
      // Admin should override all.
      if (req.decoded.user.roles.includes("admin")) {
        return next();
      } else if (req.decoded.user.roles.includes(role)) {
        return next();
      } else {
        const error = new Error("Trying to access an unauthorized action.");
        error.code = 403;
        return next(error);
      }
    };
  }

  module.exports.hasPerm = (permission) => {
    return function(req, res, next) {
      if (!req.decoded)  {
        const error = new Error("Not logged in. Invalid token.");
        error.code = 403;
        error.no_token = true;
        return next(error);
      }
      // Admin should override all.
      if (req.decoded.user.roles.includes("admin")) {
        return next();
      } else {
        Users.has_permission(req.decoded.user.id, permission).then((hasPerm) => {
          if (hasPerm) {
            return next();
          }
          const error = new Error("Trying to access an unauthorized action.");
          error.code = 403;
          return next(error);
        }).catch(next);
      }
    };
  }

  module.exports.isAuthed = () => {
      return function(req, res, next) {
        let token = req.body.token || req.query.token || req.get("x-access-token") || req.cookies['user_token'];
    
        if (!token) {
          const error = new Error("Not logged in. Missin token in body, query, x-access-token in header or user_token in cookies.");
          error.code = 403;
          error.no_token = true;
          return next(error);
        }
    
        // Checking user token.
        jwt.verify(token, config.secret, (err, decoded) => {
          if (err) {
            const error = new Error("Not logged in. Invalid token.");
            error.code = 403;
            error.no_token = true;
            return next(error);
          }
          req.decoded = decoded;
          next();
        });
      };
  }