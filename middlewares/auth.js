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

    const permissions = Hub.PermissionManager.permissions;
    if(!permissions[permission]) {
      const error = new Error("Permission doesn't exist");
      error.code = 403;
      return next(error);
    }
    const is_any = permissions[permission].hasAny;
    Hub.UserManager.getByUsername(req.decoded.user.user_name).then((user) => {
      const permissionsUser = user.permissions;
      const userRoles = user.roles;
      if(userRoles.includes("admin")) {
        return true;
      }
      if(is_any) {
        if(permissionsUser.includes(permission+"_ANY")) {
          return true;
        }
      } else {
        if(permissionsUser.includes(permission)){
          return true;
        }
      }
      return Hub.PermissionManager.getRolesInMemory().then((permissionsRoles) => {
        userRoles.forEach(role => {
          if(permissionsRoles.has(role)) {
            permissionsRoles.get(role).forEach(permission => permissionsUser.includes(permission)?null:permissionsUser.push(permission));
          }
        });
        if(is_any) {
          if(permissionsUser.includes(permission+"_ANY")) {
            return true;
          }
          if(permissionsUser.includes(permission)) {
            if(req.params.skill) {
              return Hub.hasUsernameInSkillAuthorsList(req.params.skill,req.decoded.user.user_name);
            } else { // If req.params.skill is not true, it means it's a permission that doesn't use skills but has the is_any attribute
            // So if it has the permission wihtout the ANY we still autorize it ( because there is no author's list for them )
              return true;
            }
          }
        } else {
          if(permissionsUser.includes(permission)){
            return true;
          }
        }
        return false;
      });
    }).then((hasPerm) => {
      if(hasPerm) {
        return next();
      } 
      const error = new Error("Trying to access an unauthorized action.");
      error.code = 403;
      return next(error);
    }).catch(next);


    // Check if the perm is an any OR if it doesn't exist 

    // Retrieve the roles of the user && ses permissions 

    // Check if he is an admin OR if the perm is in the array retrieved ( IF ANY )

    // Retrieve permissions for his roles

    // Check again if permissions is part of the new array

    // 
  }
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