'use strict';
const User = require("../models/userModel");
const Role = require("../models/roleModel");
const bcrypt = require("bcrypt");
const secret = require("../../secret");
const jwt = require('jsonwebtoken');
const axios = require('axios');
const logger = new (require('../../logic/components/Logger'))();

exports.is_empty = function() {
  return new Promise((resolve, reject) => {
    User.count({}, (err, count) => {
      if (err) {
        return reject(err);
      }
      return resolve(count == 0);
    })
  });
};

exports.promote_user = function(id, role) {
  return User.findById(id).then(user => {
    if (!user) {
      let error = new Error("User not found.");
      error.code = 404;
      throw error;
    }
    return user;
  }).then(user => {
    // Check if role does exists.
    return Role.count({ name: role }).then(count => {
      if (count != 1) {
        let error = new Error("No such role.");
        error.code = 404;
        throw error;
      }
      return user;
    })
  }).then(user => {
    if (!user.roles) {
      user.roles = [];
    }
    const indexOfRole = user.roles.indexOf(role);
    if (indexOfRole != -1) {
      let error = new Error("User already has this role.");
      error.code = 400;
      throw error;
    }
    user.roles.push(role);
    return user.save();
  });
};

exports.demote_user = function(id, role) {
  return User.findById(id).then(user => {
    if (!user) {
      let error = new Error('User not found');
      error.code = 404;
      throw error;
    }
    return user;
  }).then(user => {
    if (role == "admin") {
      return User.count({ roles: 'admin' }).then(count => {
        logger.log(count);
        if (count == 1) {
          let error = new Error('Cannot delete last admin user.');
          error.code = 400;
          throw error;
        }
        return user;
      })
    }
    return user;
  }).then(user => {
    if (!user.roles) {
      user.roles = [];
    }
    const indexOfRole = user.roles.indexOf(role);
    if (indexOfRole == -1) {
      let error = new Error("User does not has this role.");
      error.code = 404;
      throw error;
    }
    user.roles.splice(indexOfRole, 1);
    return user.save();
  });
};

exports.permissions_by_name = (user_name) => {
  return User.findOne({ user_name }).then(user => {
    if (!user) {
      let error = new Error("No user found.");
      error.code = 404;
      throw error;
    }
    return user.permissions;
  });
}

exports.grant_permission = function(id, permission) {
  return new Promise((resolve, reject) => {
    User.findById(id, (err, user) => {
      if (err) {
        return reject(err);
      } else if (user) {
        if (!user.permissions) {
          user.permissions = [];
        }
        const indexOfPermission = user.permissions.indexOf(permission);
        if (indexOfPermission != -1) {
          return reject(new Error("User already has this permission."));
        }
        user.permissions.push(permission);
        user.save((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(user);
        });
      } else {
        return reject();
      }
    });
  });
};

exports.grant_permissions = (id, permissions) => {
  return User.findById(id).then(user => {
    if (!user) {
      let error = new Error("No user found.");
      error.code = 400;
      throw error;
    }
    if (!user.permissions) {
      user.permissions = permissions;
    } else {
      permissions.forEach(permission => user.permissions.includes(permission) ? null : user.permissions.push(permission));
    }
    return user.save();
  }).then(user => user.permissions);
}

exports.set_permissions = (id, permissions) => {
  return User.findById(id).then(user => {
    if (!user) {
      let error = new Error("No user found.");
      error.code = 400;
      throw error;
    }
    
    user.permissions = permissions;
    return user.save();
  }).then(user => user.permissions);
}

exports.revoke_permission = function(id, permission) {
  return new Promise((resolve, reject) => {
    User.findById(id, (err, user) => {
      if (err) {
        return reject(err);
      } else if (user) {
        if (!user.permissions) {
          user.permissions = [];
        }
        const indexOfPermission = user.permissions.indexOf(permission);
        if (indexOfPermission == -1) {
          return reject(new Error("User does not has this permission."));
        }
        user.permissions.splice(indexOfPermission, 1);
        user.save((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(user);
        });
      } else {
        return reject();
      }
    });
  });
};

exports.revoke_permissions = (id, permissions) => {
  return User.findById(id).then(user => {
    if (!user) {
      let error = new Error("No user found.");
      error.code = 400;
      throw error;
    }
    if (!user.permissions) {
      user.permissions = [];
    } else {
      permissions.forEach(permission => {
        const index = user.permissions.indexOf(permission);
        if (index > -1) {
          user.permissions.splice(index, 1);
        }
      });
    }
    return user.save();
  }).then(user => user.permissions);
}

exports.has_permission = (id, permission) => {
  return new Promise((resolve, reject) => {
    User.findById(id, (err, user) => {
      if (err) {
        return reject(err);
      } else if (!user) {
        let error = new Error("No authorized user found.");
        error.code = 403;
        return reject(error);
      } else {
        return resolve(user.roles.includes("admin") || user.permissions.includes(permission));
      }
    });
  });
};

exports.has_permissions = (id, permissions) => {
  return new Promise((resolve, reject) => {
    User.findById(id, (err, user) => {
      if (err) {
        return reject(err);
      } else if (!user) {
        let error = new Error("No authorized user found.");
        error.code = 403;
        return reject(error);
      } else {
        let permissionsObject = {};
        const userIsAdmin = user.roles.includes("admin");
        permissions.forEach(perm => permissionsObject[perm] = userIsAdmin || user.permissions.includes(perm));
        return resolve(permissionsObject);
      }
    });
  });
};

exports.create_user = create_user;
function create_user(user) {
  return new Promise((resolve, reject) => {
    // check for user unicity
    User.findOne({ user_name: user.user_name.toLowerCase() }, (err, userFound) => {
      if (err) {
        return reject(err);
      } else if (userFound) {
        let error = new Error("Username already used.");
        error.code = 400;
        return reject(error);
      } else {
        // New user can be added.

        // Hash password
        bcrypt.hash(user.password || Math.random().toString(36).slice(-9), 8, (err, hash) => {
          if (err) {
            return reject(err);
          }

          // Get default role.
          Role.findOne({ default: true }, (err, role) => {
            if (err) {
              return reject(err);
            }
            
            let new_user = new User({ user_name: user.user_name.toLowerCase(), password: hash });
            
            if (role) {
              new_user.roles = [role.name];
            }

            new_user.save((err) => {
              if (err) {
                return reject(err);
              }
              return resolve({ id: new_user._id, user_name: new_user.user_name, roles: new_user.roles });
            })
          })
        });
      }
    });
  });
}

exports.delete_user = (user_name, fromAdmin = false) => {
  return new Promise((resolve, reject) => {
    User.findOne({ user_name: user_name.toLowerCase() }).then(user => {
      if (!user) {
        let error = new Error("User not found.");
        error.code = 404;
        return reject(error);
      }
      
      // If user is not admin, delete it.
      if (!user.roles.includes('admin')) {
        return resolve(User.deleteOne({ user_name: user_name.toLowerCase() }));
      }
  
      // Otherwise, things get tricky.
      // 1. Only admin should be able to delete admins.
      if (!fromAdmin) {
        let error = new Error("Only admins may remove other admins.");
        error.code = 403;
        return reject(error);
      }
  
      // Can't delete the last admin user.
      User.count({ roles: "admin" }, (err, count) => {
        if (err) {
          return reject(err);
        }
        if (count <= 1) {
          let error = new Error("Can't delete last admin user.");
          error.code = 400;
          return reject(error);
        }
  
        return resolve(User.deleteOne({ user_name: user_name.toLowerCase }));
      });
    });
  });
};

exports.remove_all = function() {
  return new Promise((resolve, reject) => {
    User.deleteMany({}, (err) => {
      if (err) {
        return reject(err);
      }
      return resolve()
    })
  });
};

exports.get_user = function(id) {
  return new Promise((resolve, reject) => {
    User.findById(id, "_id user_name registered_date last_conect roles permissions", (err, user) => {
      if (err) {
        return reject(err)
      } else if (user) {
        return resolve(user);
      } else {
        return reject();
      }
    });
  });
};

exports.get_user_roles_by_username = (user_name) => {
  return User.findOne({ user_name }, "_id user_name roles").then(user => {
    if (!user) {
      let error = new Error('No user found.')
      error.code = 404;
      throw error;
    }
    return user.roles;
  });
};

exports.get_by_username = (user_name) => {
  return User.findOne({ user_name: user_name.toLowerCase() }).then(user => {
    if (!user) {
      const error = new Error("No user found.");
      error.code = 404;
      throw error;
    }
    return user;
  });
};

exports.get_all = function(id) {
  return User.find({}, "_id user_name registered_date last_connect roles permissions");
};

exports.update_password = function(userId, currentPassword, newPassword) {
  return new Promise((resolve, reject) => {
    User.findById(userId, (err, user) => {
      if (err) {
        return reject(err);
      } else if (!user) {
        return reject(new Error("No user found."));
      } else {
        // Check password
        bcrypt.compare(currentPassword, user.password, (err, res) => {
          if (res) {
            // Hash new password
            bcrypt.hash(newPassword, 8, (err, hash) => {
              if (err) {
                return reject(err);
              }

              user.password = hash;
              user.save((err) => {
                if (err) {
                  return reject(err);
                }
                return resolve();
              })
            });
          } else {
            return reject({ error: "invalid-password", message: "Invalid password." });
          }
        });
      }
    });
  });
};

exports.update_username = function(userId, userName) {
  return new Promise((resolve, reject) => {
    // Check for user unicity.
    User.findOne({ user_name: userName.toLowerCase() }, (err, userFound) => {
      if (err) {
        return reject(err);
      } else if (userFound) {
        return reject({ error: "username-exists", message: "Username already in use." });
      } else {
        User.findByIdAndUpdate(userId, { $set: { user_name: userName.toLowerCase() }}, (err, user) => {
          if (err) {
            return reject(err);
          }
          return resolve();
        });
      }
    })
  });
};

exports.sign_in = function(username, password) {
  return new Promise((resolve, reject) => {
    if (process.env.USE_AUTH_SERVICE) {
      // Use external service if required.
      let data = {};
      data[process.env.AUTH_SERVICE_USERNAME_FIELD.trim()] = username;
      data[process.env.AUTH_SERVICE_PASSWORD_FIELD.trim()] = password;


      axios({
        method: process.env.AUTH_SERVICE_METHOD.trim(),
        url: process.env.AUTH_SERVICE_ROUTE.trim(),
        data
      }).then(response => {
        // Auth is a success. Find local user.
        User.findOne({ user_name: username.toLowerCase() }, function(err, user) {
          if (err) {
            logger.error(err);
            return reject({ message: "Could not find user." });
          } else if (user) {
            let token = jwt.sign({ user: { user_name: user.user_name.toLowerCase(), id: user._id, roles: user.roles }}, secret.secret, { expiresIn: '1d' });
            return resolve({ message: "User signed in.", token });
          } else {
            create_user({ user_name: username }).then(user => {
              let token = jwt.sign({ user: { user_name: user.user_name.toLowerCase(), id: user.id, roles: user.roles }}, secret.secret, { expiresIn: '1d' });
              return resolve({ message: "User created and signed in.", token, user });
            }).catch(err => {
              logger.error(err);
              return reject({ message: "Auth service approved the connexion, but the brain was unable to create a new user associated." });
            });
          }
        });
      }).catch(err => {
        let error;
        if (err.response && err.response.data) {
          error = new Error(err.response.data.message || "Unkown error with Auth Service.");
          error.code = err.response.data.code;
          error.errors = err.response.data.errors;
        } else {
          error = new Error("Could not contact auth service.");
          error.code = 500;
        }
        
        return reject(error);
      });
    } else {
      // Otherwise, check against local database.
      User.findOne({ user_name: username.toLowerCase() }, function(err, user) {
        if (err) {
          logger.error(err.stack);
          return reject(new Error("Could not find user."));
        } else if (user) {
          bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
              // Password matched, generate token.
              let token = jwt.sign({ user: { user_name: user.user_name.toLowerCase(), id: user._id, roles: user.roles }}, secret.secret, { expiresIn: '1d' });
              return resolve({ message: "User signed in.", token: token });
            } else {
              return reject({ code: 403, message: "Invalid password." });
            }
          });
        } else {
          return reject({ code: 404, message: "No user with this user_name."});
        }
      });
    }
  });
};

exports.verify_token = (token) => {
  return new Promise((resolve, reject) => {
    // Checking user token.
    jwt.verify(token, secret.secret, (err, decoded) => {
      if (err) {
        return reject(err); 
      }
      return resolve(decoded);
    });
  });
};