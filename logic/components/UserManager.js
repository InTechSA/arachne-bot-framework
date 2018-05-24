'use strict';

exports.UserManager = class UserManager {
    constructor(userController) {
        this.userController = userController || require("./../../database/controllers/userController");
    }

    create(username, password) {
        if (!password) {
            return this.userController.create_user({ user_name: username, password: Math.random().toString(36).slice(-9) });
        }
        return this.userController.create_user({ user_name: username, password });
    }

    delete(user_name, fromAdmin = false) {
        return this.userController.delete_user(user_name, fromAdmin);
    }

    getAll() {
        return this.userController.get_all();
    }

    getByUsername(user_name) {
        return this.userController.get_by_username(user_name);
    }

    verifyToken(token) {
        return this.userController.verify_token(token);
    }

    userRolesByName(userName) {
        return this.userController.get_user_roles_by_username(userName);
    }

    userPermissionsByName(userName) {
        return this.userController.permissions_by_name(userName);
    }

    userHasPermission(userId, permission) {
        return this.userController.has_permission(userId, permission);
    }

    userHasPermissions(userId, permissions) {
        return this.userController.has_permissions(userId, permissions);
    }

    grantPermissionsByName(userName, permissions) {
        return this.userController.get_by_username(userName).then(user => {
            return this.userController.grant_permissions(user.id, permissions);
        });
    }

    revokePermissionsByName(userName, permissions) {
        return this.userController.get_by_username(userName).then(user => {
            return this.userController.revoke_permissions(user.id, permissions);
        });
    }

    createRole(roleName) {
        return Promise.reject();
    }

    deleteRole(roleName) {
        return Promise.reject();
    }

    assignRole(userName, roleName) {
        return this.userController.get_by_username(userName).then(user => {
            return this.userController.promote_user(user.id, roleName);
        });
    }

    removeRole(userName, roleName) {
        return this.userController.get_by_username(userName).then(user => {
            return this.userController.demote_user(user.id, roleName);
        });
    }

    getRoleUsers(roleName) {
        return Promise.resolve([]);
    }

    getRoleInformations(roleName) {
        return Promise.resolve({ name: "admin", permissions: ["ALL"] });
    }

    editRole(roleName, options) {
        return Promise.reject();
    }
};
