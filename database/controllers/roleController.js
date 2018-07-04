'use strict';
const Role = require('../models/roleModel');
const User = require('../models/userModel');

var rolesPermissions = null;

Role.find({}).then(roles => {
    rolesPermissions = new Map(roles.map(role => [role.name, role.permissions]));
}).catch((err) => {
    rolesPermissions = new Map();
});

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
        rolesPermissions.set(name,permissions);
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
        rolesPermissions.set(name, permissions);
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
            rolesPermissions.set(name,permissions);
          } else {
            var newPermissions = role.permissions;
            permissions.forEach(permission => {
                if(!newPermissions.includes(permission)) {
                    newPermissions.push(permission);
                } 
            });
            role.permissions = newPermissions;
            rolesPermissions.set(name,newPermissions);
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
            var newPermissions = role.permissions;
            permissions.forEach(permission => {
                const index = newPermissions.indexOf(permission);
                if (index > -1) {
                    newPermissions.splice(index, 1);
                }
            });
            role.permissions = newPermissions;
            rolesPermissions.set(name, newPermissions);
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
        rolesPermissions.delete(name);
        return Role.remove({ name });
    });
};

module.exports.search_by_permission = (permission) => {
    return Role.find({ permissions: permission }).then(roles => {
        return roles.map(role => role.name);
    });
}

module.exports.get_default_role = () => {
    return Role.findOne({ default: true });
}

module.exports.set_default_role = (name) => {
    return Role.findOne({ name }).then(role => {
        if (!role) {
            const error = new Error("Role not found.");
            error.code = 404;
            throw error;
        }
        
        // Update current role.
        return Role.findOneAndUpdate({ default: true }, { $set: { default: false }}).then(() => {
            role.default = true;
            return role.save();
        });
    });
}

module.exports.get_roles_in_memory = () => {
    return Promise.resolve(rolesPermissions);
}