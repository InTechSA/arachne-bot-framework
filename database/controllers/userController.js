'use strict';
var User = require("../models/userModel");
const bcrypt = require("bcrypt");
const secret = require("../../secret");
const jwt = require('jsonwebtoken');

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
  return new Promise((resolve, reject) => {
    User.findById(id, (err, user) => {
      if (err) {
        return reject(err);
      } else if (user) {
        if (!user.roles) {
          user.roles = [];
        }
        const indexOfRole = user.roles.indexOf(role);
        if (indexOfRole != -1) {
          return reject(new Error("User already has this role."));
        }
        user.roles.push(role);
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

exports.demote_user = function(id, role) {
  return new Promise((resolve, reject) => {
    User.findById(id, (err, user) => {
      if (err) {
        return reject(err);
      } else if (user) {
        if (!user.roles) {
          user.roles = [];
        }
        const indexOfRole = user.roles.indexOf(role);
        if (indexOfRole == -1) {
          return reject(new Error("User does not has this role."));
        }
        user.roles.splice(indexOfRole, 0);
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
        user.permissions.splice(indexOfPermission, 0);
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

exports.has_permission = (id, permission) => {
  return new Promise((resolve, reject) => {
    User.findById(id, (err, user) => {
      if (err) {
        return reject(err);
      } else if (!user) {
        return reject(new Error("No user found."));
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
        return reject(new Error("No user found."));
      } else {
        let permissionsObject = {};
        const userIsAdmin = user.roles.includes("admin");
        permissions.forEach(perm => permissionsObject[perm] = userIsAdmin || user.permissions.includes(perm));
        return resolve(permissionsObject);
      }
    });
  });
}

exports.create_user = function(user) {
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
        bcrypt.hash(user.password, 8, (err, hash) => {
          if (err) {
            return reject(err);
          }

          let new_user = new User({ user_name: user.user_name.toLowerCase(), password: hash });
          new_user.save((err) => {
            if (err) {
              return reject(err);
            }
            return resolve({ user: { id: new_user._id }});
          })
        });
      }
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

exports.get_by_username = (user_name) => {
  console.log(user_name.toLowerCase())
  return User.findOne({ user_name: user_name.toLowerCase() });
}

exports.get_all = function(id) {
  return User.find({}, "_id user_name registered_date last_connect roles permissions");
}

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

exports.sign_in = function(user_name, password) {
  return new Promise((resolve, reject) => {
    User.findOne({ user_name: user_name.toLowerCase() }, function(err, user) {
      if (err) {
        console.log(err.stack);
        return reject();
      } else if (user) {
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            // Password matched, generate token.
            let token = jwt.sign({ user: { user_name: user_name.toLowerCase(), id: user._id, roles: user.roles }}, secret.secret, { expiresIn: '1d' });
            return resolve({ message: "User signed in.", token: token });
          } else {
            return reject({ message: "Invalid password." });
          }
        });
      } else {
        return reject({ message: "No user with this user_name."});
      }
    });
  })
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
}