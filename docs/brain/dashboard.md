# Dashboard
The Dashboard is where you can create new skills, edit existing one, manage adapters, monitor the bot, and so on.

The Dashboard will be accessible by default at `/dashboard`.

> All operations can be achieved using the API without using the dashboard.


## Setup
In order to use the dashboard, you must setup the API. Follow the `/setup` route to create the admin user (as defined in the environment variables).


## Users and Accounts
By default, only administrators can access the dashboard. If you do not use an external Auth Service, no other users can register. If you use an external Auth Service, all users will be able to login in. They will be given the default role and permission set. (Which is, by default, nothing.)

If you do not use an Auth Service, admins can create new user users from the `/dashboard/users` panel. Users will be able to change their password.

## Permissions
All operations are restricted by a permission system. Accessing the dashboard portal requires, for instance, the SEE_DASHBOARD permission.

A user may have its own permissions, and inherits from its group permissions. Group and User permissions are managed from the `/dashboard/users` panel.

You may define a default role with a set of permissions that will be granted to all new users (this is NOT retroactive). You can create and remoev all roles, except the **admin** role. You can't also delete all admin users. And only admins can delete admin users.

## Adapters
Only authorized adapters can use the brain. You can add, manage, and delete adapters from the `/dashboard/connectors` panel.

## Skills
This is the core of the dashboard. In the `/dashboard/skills` panel, you can edit your skills and create new ones.

By default, only admin have access to this page, and only them can create new skills. But you can assign the SEE_SKILLS and the CREATE_SKILL permissions (and similar permissions) to allow other group/users to manage skills. Users will only be able to the the skills they have created or they have access to, unless they have the SEE_SKILLS_ANY permission.

Using the action buttons, you can:
- Reload the skill.
- See the logs of the skill and manage its storage, hooks and pipes.
- Toggle a skill.
- Delete a skill.
- Go the the editor.

The Editor allow you to edit the code of a skill. Help is available in the right panel (or at the bottom of the page on small devices). Don't forget to save your skill. The UI will warn you if anything goes wrong while saving your code. You can also access the logs of the skill from withi the editor.

## Test
You can test your skills from the Dashboard Portal, assuming you have created a "Dashboard" (case-sensitive) adapter that is active. Warning, the chat sandbox does not support rich messages with attachments and message formatting is quite prehistoric, but it's enough for debug. You can't use hooks and pipes with the chat sandbox.
