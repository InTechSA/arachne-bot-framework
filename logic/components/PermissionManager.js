'use strict';

exports.PermissionManager = class PermissionManager {
    constructor(roleController) {
        this.roleController = roleController || require("./../../database/controllers/roleController");
    }

    getRoles() {
        return this.roleController.get_roles();
    }

    getRole(role) {
        return this.roleController.get_role(role);
    }

    createRole(name, permissions) {
        return this.roleController.create_role(name, permissions);
    }

    deleteRole(name) {
        return this.roleController.delete_role(name);
    }
};
