const jwt = require('jsonwebtoken');
const Hub = require('../logic/hub');

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
    Hub.UserManager.userHasPermission(req.decoded.user.id, permission).then(hasPerm => {
      if (hasPerm) {
        return hasPerm;
      }
      // Search for permission in users's role.
      return Hub.PermissionManager.getRolesWithPermission(permission).then(roles => {
        return Hub.UserManager.userRolesByName(req.decoded.user.user_name).then(userRoles => {
          return userRoles.filter(role => roles.includes(role)).length >= 1;
        });
      });
    }).then((hasPerm) => {
      if (hasPerm) {
        return next();
      }
      const error = new Error("Trying to access an unauthorized action.");
      error.code = 403;
      return next(error);
    }).catch(next);
  };
}

module.exports.isAuthed = () => {
    return function(req, res, next) {
      let token = req.body.token || req.query.token || req.get("x-access-token") || (req.get("Authorization") ? req.get("Authorization").split(" ")[1] : null) || req.cookies['user_token'];
  
      if (!token) {
        const error = new Error("Not logged in. Missin token in body, query, x-access-token in header or user_token in cookies.");
        error.code = 403;
        error.no_token = true;
        return next(error);
      }

      Hub.UserManager.verifyToken(token).then(decoded => {
        req.decoded = decoded;
        next();
      }).catch((err) => {
        const error = new Error("Not logged in. Invalid token.");
        error.code = 403;
        error.no_token = true;
        return next(error);
      });
    };
}