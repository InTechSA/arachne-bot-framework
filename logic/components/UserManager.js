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

    getAll() {
        return this.userController.get_all();
    }

    getByUsername(user_name) {
        return this.userController.get_by_username(user_name);
    }

    verifyToken(token) {
        return this.userController.verify_token(token);
    }

    userHasPermission(userId, permission) {
        return this.userController.has_permission(userId, permission);
    }

    userHasPermissions(userId, permissions) {
        return this.userController.has_permissions(userId, permissions);
    }

    createRole(roleName) {
        return Promise.reject();
    }

    deleteRole(roleName) {
        return Promise.reject();
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
