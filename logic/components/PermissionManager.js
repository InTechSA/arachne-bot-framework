'use strict';

exports.PermissionManager = class PermissionManager {
    constructor(roleController) {
        this.roleController = roleController || require("./../../database/controllers/roleController");

        // FROM permission table
        // let perms = {};
        // table.split("\n").map(l => l.split("|").map(el => el.trim()).filter(el => el.length > 0)).filter(t => t.length >= 2).map(p => perms[p[0]] = { description: p[1] })
        //
        this.permissions = {
            "ACCESS_DASHBOARD": {
              "description": "Access the portal of the dashboard."
            },
            "CREATE_USER": {
              "description": "Create a new user"
            },
            "DELETE_USER": {
              "description": "Delete users."
            },
            "SEE_USERS": {
              "description": "See list of users"
            },
            "ASSIGN_ROLE": {
              "description": "Assign role to a user."
            },
            "GRANT_PERM": {
              "description": "Grant permissions to a user."
            },
            "REMOVE_ROLE": {
              "description": "Remove role from a user."
            },
            "REVOKE_PERM": {
              "description": "Revoke permissions to a user."
            },
            "SEE_USER_LAST_CONNECT": {
              "description": "Access last connect date of users"
            },
            "SEE_USER_PERM": {
              "description": "Access permissions of users"
            },
            "SEE_USER_ROLE": {
              "description": "Access roles of users"
            },
            "SEE_ROLES": {
              "description": "Access list of roles."
            },
            "MANAGE_ROLES": {
              "description": "Create and delete roles."
            },
            "APPROVE_SKILL": {
              "description": "Approve a skill that may be activated later."
            },
            "CREATE_SKILL": {
              "description": "Create a new skill (the user will be granted rights on it)."
            },
            "DELETE_SKILL": {
              "description": "Delete a skill the user has access to (TUHAT)",
              hasAny: true
            },
            "DELETE_SKILL_HOOKS": {
              "description": "Clear hooks for a skill the user has access to.",
              hasAny: true
            },
            "DELETE_SKILL_PIPES": {
              "description": "Clear pipes for a skill the user has access to.",
              hasAny: true
            },
            "DELETE_SKILL_STORAGE": {
              "description": "Clear storage for a skill the user has access to.",
              hasAny: true
            },
            "EDIT_SKILL": {
              "description": "Edit a skill the user has access to.",
              hasAny: true
            },
            "EDIT_SKILL_CODE": {
              "description": "Edit the code of a skill the user has access to.",
              hasAny: true
            },
            "EDIT_SKILL_SECRET": {
              "description": "Edit the secret of a skill the user has access to.",
              hasAny: true
            },
            "MONITOR_SKILL": {
              "description": "Monitor a skill (clear hooks, storage...)",
              hasAny: true
            },
            "RELOAD_SKILL": {
              "description": "Reload a skill the user has access to.",
              hasAny: true
            },
            "SEE_SKILLS": {
              "description": "See list of skills the user has access to."
            },
            "SEE_SKILL_CODE": {
              "description": "See the code of a skill the user has access to.",
              hasAny: true
            },
            "SEE_SKILL_LOGS": {
              "description": "See the logs of a skill the user has access to.",
              hasAny: true
            },
            "DELETE_SKILL_LOGS": {
              "description": "Delete the logs of a skill the user has access to.",
              hasAny: true
            },
            "SEE_SKILL_HOOKS": {
              "description": "See the logs of a skill the user has access to.",
              hasAny: true
            },
            "SEE_SKILL_STORAGE": {
              "description": "See the logs of a skill the user has access to.",
              hasAny: true
            },
            "SEE_SKILL_PIPES": {
              "description": "Get the list of pipes active for a skill TUHAT.",
              hasAny: true
            },
            "SEE_SKILL_SECRET": {
              "description": "see the secret of a skill the user has access to.",
              hasAny: true
            },
            "TOGGLE_SKILLS": {
              "description": "Activate/Deactivate a skill the user has access to.",
              hasAny: true
            },
            "APPROVE_ADAPTER": {
              "description": "Approve an adapter that may be activated later."
            },
            "CREATE_ADAPTER": {
              "description": "Create a new adapter (the user will be granted rights on it)."
            },
            "DELETE_ADAPTER": {
              "description": "Delete an adapter the user has access to (TUHAT).",
              hasAny: true
            },
            "EDIT_ADAPTER": {
              "description": "Edit an adapter the user has acces to.",
              hasAny: true
            },
            "REFRESH_ADAPTER_TOKEN": {
              "description": "Refresh to token of an adapter the user has access to.",
              hasAny: true
            },
            "SEE_ADAPTERS": {
              "description": "See list of adapters the user has access to",
              hasAny: true
            },
            "SEE_ADAPTER_TOKEN": {
              "description": "Get details (and token) of an adapter TUHAT.",
              hasAny: true
            },
            "TOGGLE_ADAPTER": {
              "description": "Activate/Deactivate an adapter the user has access to.",
              hasAny: true
            },
            "CLEAR_STORAGE": {
              "description": "Clear the storage of the brain."
            },
            "RELOAD_BRAIN": {
              "description": "Reload the brain."
            },
            "CONFIGURE_BRAIN": {
              "description": "Access brain configuration"
            },
            "EDIT_SKILL_AUTHORS": {
              "description": "Edit the list of authors of a skill TUHAT",
              hasAny: true
            }
        }
    }

    getRoles() {
        return this.roleController.get_roles();
    }

    getRolesWithPermission(permission) {
      return this.roleController.search_by_permission(permission);
    }

    getRole(role) {
        return this.roleController.get_role(role);
    }

    getDefaultRole() {
      return this.roleController.get_default_role();
    }

    setDefaultRole(name) {
      return this.roleController.set_default_role(name);
    }

    createRole(name, permissions) {
        return this.roleController.create_role(name, permissions);
    }

    updateRolePermissions(name, permissions) {
        return this.roleController.update_role_permissions(name, permissions);
    }

    deleteRole(name) {
        return this.roleController.delete_role(name);
    }

    getRolesInMemory() {
      return this.roleController.get_roles_in_memory();
    }
};
