# Permissions

> **Admin** have all permissions.

> Beware that certain permissions may required some other to be fully accomplished. (Allowing a user to EDIT_SKILL_CODE without allowing him to SEE_SKILL_CODE is not very convenient.)

> TUHAT = The User Has Access To.

> Suffix `_ANY` to permissions with `*` to remove the "The User Has Access To" condition.

| Permission            | Description                                                   |
| --------------------- | -----------------------------------------------------         |
| ACCESS_DASHBOARD      | Access the portal of the dashboard.                           |
|                       |                                                               |
| CREATE_USER           | Create a new user                                             |
| DELETE_USER           | Delete users.                                                 |
| SEE_USERS             | See list of users                                             |
| ASSIGN_ROLE           | Assign role to a user.                                        |
| GRANT_PERM            | Grant permissions to a user.                                  |
| REMOVE_ROLE           | Remove role from a user.                                      |
| REVOKE_PERM           | Revoke permissions to a user.                                 |
| SEE_USER_LAST_CONNECT | Access last connect date of users                             |
| SEE_USER_PERM         | Access permissions of users                                   |
| SEE_USER_ROLE         | Access roles of users                                         |
|                       |                                                               |
| SEE_ROLES             | Access list of roles.                                         |
| MANAGE_ROLES          | Create and delete roles.                                      |
|                       |                                                               |
| APPROVE_SKILL         | Approve a skill that may be activated later.                  |
| CREATE_SKILL          | Create a new skill (the user will be granted rights on it).   |
| DELETE_SKILL*         | Delete a skill the user has access to (TUHAT)                 |
| DELETE_SKILL_HOOKS*   | Clear hooks for a skill the user has access to.               |
| DELETE_SKILL_PIPES*   | Clear pipes for a skill the user has access to.               |
| DELETE_SKILL_STORAGE* | Clear storage for a skill the user has access to.             |
| EDIT_SKILL*           | Edit a skill the user has access to.                          |
| EDIT_SKILL_CODE*      | Edit the code of a skill the user has access to.              |
| EDIT_SKILL_SECRET*    | Edit the secret of a skill the user has access to.            |
| MONITOR_SKILL*        | Monitor a skill (clear hooks, storage...)                     |
| RELOAD_SKILL*         | Reload a skill the user has access to.                        |
| SEE_SKILLS*           | See list of skills the user has access to.                    |
| SEE_SKILL_CODE*       | See the code of a skill the user has access to.               |
| SEE_SKILL_LOGS*       | See the logs of a skill the user has access to.               |
| SEE_SKILL_PIPES*      | Get the list of pipes active for a skill TUHAT.               |
| SEE_SKILL_SECRET*     | see the secret of a skill the user has access to.             |
| TOGGLE_SKILLS*        | Activate/Deactivate a skill the user has access to.           |
|                       |                                                               |
| APPROVE_ADAPTER       | Approve an adapter that may be activated later.               |
| CREATE_ADAPTER        | Create a new adapter (the user will be granted rights on it). |
| DELETE_ADAPTER*       | Delete an adapter the user has access to (TUHAT).             |
| EDIT_ADAPTER*         | Edit an adapter the user has acces to.                        |
| REFRESH_ADAPTER_TOKEN | Refresh to token of an adapter the user has access to.        |
| SEE_ADAPTERS*         | See list of adapters the user has access to                   |
| SEE_ADAPTER_TOKEN*    | Get details (and token) of an adapter TUHAT.                  |
| TOGGLE_ADAPTER*       | Activate/Deactivate an adapter the user has access to.        |
|                       |                                                               |
| CLEAR_STORAGE         | Clear the storage of the brain.                               |
| RELOAD_BRAIN          | Reload the brain.                                             |
|                       |                                                               |
| CONFIGURE_BRAIN       | Access brain configuration                                    |

