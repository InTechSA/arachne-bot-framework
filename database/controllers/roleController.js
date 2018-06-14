'use strict';
const Role = require('../models/roleModel');
const User = require('../models/userModel');

module.exports.get_roles = function() {
    return Role.find({});
};

module.exports.get_role = (name) => {
    return Role.findOne({ name }).then(role => {
        if (!role) {
            let error = new Error("Role not found.");
            error.code = 404;
            throw error;
        }
        return role;
    });
}

module.exports.create_role = function(name, permissions) {
    return Promise.resolve().then(() => {
        return Role.count({ name });
    }).then(count => {
        if (count > 0) {
            let error = new Error("Role already defined.");
            error.code = 400;
            throw error;
        }
        const role = new Role({ name, permissions });
        return role.save();
    });
};

module.exports.update_role_permissions = function(name, permissions) {
    return Role.findOne({ name }).then(role => {
        if (!role) {
            let error = new Error("No role found.");
            error.code = 404;
            throw error;
        }

        role.permissions = permissions;
        return role.save();
    });
};

module.exports.add_permissions = (name, permissions) => {
    return Role.findOne({ name }).then(role => {
        if (!role) {
            let error = new Error("No role found.");
            error.code = 404;
            throw error;
        }
        if (!role.permissions) {
            role.permissions = permissions;
          } else {
            permissions.forEach(permission => role.permissions.includes(permission) ? null : role.permissions.push(permission));
          }
          return role.save();
    }).then(role => role.permissions);
};

module.exports.remove_permissions = (name, permissions) => {
    return Role.findOne({ name }).then(role => {
        if (!role) {
            let error = new Error("No role found.");
            error.code = 404;
            throw error;
        }
        if (!role.permissions) {
            role.permissions = [];
          } else {
            permissions.forEach(permission => {
                const index = role.permissions.indexOf(permission);
                if (index > -1) {
                    role.permissions.splice(index, 1);
                }
              });
          }
          return role.save();
    }).then(role => role.permissions);
};

module.exports.delete_role = function(name) {
    return Promise.resolve().then(() => {
        if (name == 'admin') {
            let error = new Error("Can not remove admin role.");
            error.code = 404;
            throw error;
        }

        // Remove this role from all users.
        return User.update({ roles: name }, { $pull: { roles: name }});
    }).then(() => {
        return Role.remove({ name });
    });
};
