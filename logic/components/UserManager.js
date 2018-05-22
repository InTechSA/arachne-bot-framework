'use strict';

exports.UserManager = class UserManager {
    constructor(userController) {
        this.userController = userController || require("./../../database/controllers/userController");
    }

    getAll() {
        return this.userController.get_all();
    }

    verifyToken(token) {
        return this.userController.verify_token(token);
    }

    userHasPermission(userId, permission) {
        return this.userController.has_permission(userId, permission);
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
