function modifyBaseRole() {
    notifyUser({
        title: "Not implemented",
        message: "You can't modify the default role yet.",
        type: "warning"
    });
}

//////////////////////////////////
// USERS

function addUser() {
    $("#new-user-modal .form-control").val('');
    $("#new-user-modal").modal('show');
}

function displayModalAlert(modal, { title = "Error", message = "Could not attempt action." }) {
    $(`${modal} .modal-alert`).empty();
    $(`${modal} .modal-alert`).append(`
      <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <h4 class="alert-heading">${title}</h4>
        <p>${message}</p>
        <button class="close" type="button" data-dismiss="alert" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    `.trim());
}

$("#new-user-form").submit((event) => {
    event.preventDefault();
    // validate form
    const user_name = $("#new-user-form #new-user-name").val();
    const usernameRegex = /^[a-zA-Z\u00C0-\u017F0-9.\-' ]{3,50}$/;
    if (!usernameRegex.test(user_name)) {
        return displayModalAlert("#new-user-modal", {
            title: "Invalid username",
            message: "Username should not be between 3 and 50 characters, and should not contains special chars."
        });
    }

    const password = $("#new-user-form #new-user-password").val();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[\u00C0-\u017FA-Za-z\d$@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return displayModalAlert("#new-user-modal", {
            title: "Invalid password",
            message: "Password should contain at least 8 chars, a capital letter, a special character and a digit."
        });
    }

    $.ajax({
        method: "POST",
        baseUrl: base_url,
        url: "/users",
        data: { user_name, password },
        dataType: "json",
        success: function(json) {
          console.log(json);
          if (json.success) {
            $("#new-user-modal").modal('hide');
            $("#user-list").append(`<tr data-user='${user_name}'><th scope='row'>${user_name}</th><td>${json.user.roles.join(", ")}</td><td><i class='text-primary action ml-1 fas fa-eye' title="See permissions of user" onClick="seeUserPerms(this)" data-user='${user_name}'></i><i class='text-warning action ml-1 fas fa-crown' title="Manage user roles" onClick="manageUserRoles(this)" data-user='${user_name}'></i><i class='text-secondary action ml-1 fas fa-cog' title="Manage user" onClick="manageUser(this)" data-user='${user_name}'></i><i class='text-danger action ml-1 fas fa-trash-alt' title="Delete user" onClick="deleteUser(this)" data-user='${user_name}'></i>`.trim())
            notifyUser({
              title: "User created",
              message: `Created user ${user_name}`,
              type: "success",
              delay: 5
            });
          } else {
            if (json.errors || json.message) {
                return displayModalAlert("#new-user-modal", {
                    title: json.errors[0].title || "Couldn't create error.",
                    message: json.errors[0].message || json.message || "Creation rejected."
                });
            }
          }
        },
        error: function(err) {
          return displayModalAlert("#new-user-modal", {
            title: "Could not create user.",
            message: err.responseJSON.message || "Couldn't create user (server or network error)."
        });
        }
      });
});

function deleteUser(button) {
    const user = $(button).data('user');
    $("#delete-modal .modal-title").text(`Delete ${user}?`)
    $("#delete-modal .modal-text").text(`Wow! Do you really want to delete the user ${user}?`)
    $("#delete-modal .confirm").click(() => {
        $.ajax({
            method: "DELETE",
            baseUrl: base_url,
            url: `/users/${user}`,
            dataType: "json",
            success: function(json) {
              if (json.success) {
                $("#delete-modal").modal('hide');
                $("#user-list").find(`[data-user='${user}']`).remove();
                notifyUser({
                  title: "User deleted",
                  message: `Deleted ${user}`,
                  type: "success",
                  delay: 5
                });
              } else {
                if (json.errors || json.message) {
                    return displayModalAlert("#delete-modal", {
                        title: json.errors[0].title || "Error.",
                        message: json.errors[0].message || json.message ||"Could not delete user."
                    });
                }
              }
            },
            error: function(err) {
                return displayModalAlert("#delete-modal", {
                    title: "Could not delete user.",
                    message: err.responseJSON.message || "Server or Network error."
                });
            }
          });
    });
    $("#delete-modal").modal('show');
}


/////////////////////////////////////
// MANAGE USER ROLES

function manageUserRoles(button) {
    const user = $(button).data('user');
    $('#user-roles-modal .user').text(user);
    // Get roles of user
    $.ajax({
        method: "GET",
        baseUrl: base_url,
        url: `/users/${user}/roles`,
        success: (json) => {
            $('#user-roles-modal .role-list').empty();
            json.roles.forEach(role => {
                $('#user-roles-modal .role-list').append(makeUserRoleHtml(user, role));
            });

            // Get available roles
            $.ajax({
                method: "GET",
                baseUrl: base_url,
                url: `/roles`,
                success: (json) => {
                    $('#user-roles-modal .selected-role').empty();
                    json.roles.forEach(role => {
                        $('#user-roles-modal .selected-role').append($('<option>', {
                            value: role,
                            text: role
                        }));
                    });
                    $('#user-roles-modal').modal('show');
                },
                error: (error) => {
                    notifyUser({
                        title: "Could not get roles.",
                        message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                        type: "error",
                        delay: 2
                    });
                }
            });
        },
        error: (error) => {
            notifyUser({
                title: "Could not get roles.",
                message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                type: "error",
                delay: 2
            });
        }
    });
}

function assignRole() {
    const user = $($('#user-roles-modal .user')[0]).text();
    const role = $('#user-roles-modal .selected-role').val();
    // Get roles of user
    $.ajax({
        method: "PUT",
        baseUrl: base_url,
        url: `/users/${user}/roles/${role}`,
        success: (json) => {
            $('#user-roles-modal .role-list').empty();
            json.roles.forEach(role => {
                $('#user-roles-modal .role-list').append(makeUserRoleHtml(user, role));
            });
        },
        error: (error) => {
            notifyUser({
                title: "Could not not add role.",
                message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                type: "error",
                delay: 2
            });
        }
    });
}

function removeUserRole(user, role) {
    $.ajax({
        method: "DELETE",
        baseUrl: base_url,
        url: `/users/${user}/roles/${role}`,
        success: (json) => {
            $('#user-roles-modal .role-list').empty();
            json.roles.forEach(role => {
                $('#user-roles-modal .role-list').append(makeUserRoleHtml(user, role));
            });
        },
        error: (error) => {
            notifyUser({
                title: "Could not not remove role.",
                message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                type: "error",
                delay: 2
            });
        }
    });
}

function makeUserRoleHtml(user, role) {
    return `<li class="list-group-item d-flex justify-content-between align-items-center">${role} <i class="fas fa-minus text-danger action" title="Remove role" onClick="removeUserRole('${user}', '${role}')"></i></li>`;
}

//
/////////////////////////////////////

/////////////////////////////////////
// MANAGE USER PERMISSIONS

function seeUserPerms(button) {
    // Get curret user's permissions
    const user = $(button).data("user");

    $.ajax({
        method: "GET",
        baseUrl: base_url,
        url: `/users/${user}/permissions`,
        success: (json) => {
            let permissions = json.permissions || [];
            $("#user-permissions-form .form-check-input").map((i, el) => $(el).prop("checked", permissions.includes(el.value)));

            $("#user-perms-modal .user").text(`${user}`);
            $("#user-perms-modal").modal("show");
        },
        error: (error) => {
            notifyUser({
                title: "Could not get user's permissions.",
                message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                type: "error",
                delay: 2
            });
        }
    });
}

$("#user-permissions-form").submit(event => {
    event.preventDefault();

    const user = $($('#user-perms-modal .user')[0]).text();

    // Get checked permissions.
    let permissions = [...$("#user-permissions-form .form-check input:checked").map((i, el) => $(el).val())];

    // Push them to API.
    $.ajax({
        method: "PUT",
        baseUrl: base_url,
        url: `/users/${user}/permissions?replace=true`,
        data: { permissions: permissions || [] },
        success: (json) => {
            $("#user-perms-modal").modal("hide");
            notifyUser({
                title: "Permissions of " + user + " updated.",
                message: "",
                type: "success",
                delay: 2
            });
        },
        error: (error) => {
            notifyUser({
                title: "Could not set user's permissions.",
                message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                type: "error",
                delay: 2
            });
        }
    });
});

//
/////////////////////////////////////

function manageUser(button) {
    notifyUser({
        title: "Not implemented",
        message: "You can't manage users yet.",
        type: "warning"
    });
}

function collapseUserList() {
    $("#user-list-collapse").collapse('toggle');
}

$("#user-list-collapse").on('hidden.bs.collapse', () => {
    $("#user-list .icon-show").toggleClass('d-none');
});

$("#user-list-collapse").on('shown.bs.collapse', () => {
    $("#user-list .icon-show").toggleClass('d-none');
});

//////////////////////////////////
// ROLES
function addRole() {
    $('#new-role-modal').modal('show');
}

$('#new-role-form').submit(e => {
    e.preventDefault();

    const name = $('#new-role-form #new-role-name').val();
    // Get checked permissions.
    let permissions = [...$("#new-role-form .form-check input:checked").map((i, el) => $(el).val())];

    $.ajax({
        method: "PUT",
        baseUrl: base_url,
        url: "/roles",
        data: {
            role: {
                name,
                permissions
            }
        },
        success: (response) => {
            $('#role-list-collapse').append(`
                <tr data-role="${response.role.name}">
                    <th scope='row'>${response.role.name}</th>
                    <td>
                        <i class="text-success action ml-1 fas fa-users" title="See members" onClick="seeRoleUsers(this)" data-role="${response.role.name}"></i>
                        <i class="text-primary action ml-1 fas fa-eye" title="Manage role" onClick="manageRole(this)" data-role="${response.role.name}"></i>
                        <i class="text-danger action ml-1 fas fa-trash-alt" title="Delete role" onClick="deleteRole(this)" data-role="${response.role.name}"></i>
                    </td>
                </tr>
            `);
            $('#new-role-modal').modal('hide');
        },
        error: (err) => {
            displayModalAlert("#new-role-modal", { title: "Can't create role", message: err.responseJSON.message || "An error occured." });
        }
    })
});

function deleteRole(button) {
    const role = $(button).data('role');
    $("#delete-modal .modal-title").text(`Delete ${role}?`)
    $("#delete-modal .modal-text").text(`Wow! Do you really want to delete the role ${role}?`)
    $("#delete-modal .confirm").click(() => {
        $.ajax({
            method: "DELETE",
            baseUrl: base_url,
            url: `/roles/${role}`,
            dataType: "json",
            success: function(json) {
              if (json.success) {
                $("#delete-modal").modal('hide');
                $("#role-list-collapse").find(`[data-role='${role}']`).remove();
                notifyUser({
                  title: "role deleted",
                  message: `Deleted ${role}`,
                  type: "success",
                  delay: 5
                });
              } else {
                if (json.errors || json.message) {
                    return displayModalAlert("#delete-modal", {
                        title: json.errors[0].title || "Error.",
                        message: json.errors[0].message || json.message ||"Could not delete role."
                    });
                }
              }
            },
            error: function(err) {
                return displayModalAlert("#delete-modal", {
                    title: "Could not delete user.",
                    message: err.responseJSON.message || "Server or Network error."
                });
            }
          });
    });
    $("#delete-modal").modal('show');
}

function manageRole(button) {
    notifyUser({
        title: "Not implemented",
        message: "You can't manage roles yet.",
        type: "warning"
    });
}

function collapseRoleList() {
    $("#role-list-collapse").collapse('toggle');
}

$("#role-list-collapse").on('hidden.bs.collapse', () => {
    $("#role-list .icon-show").toggleClass('d-none');
});

$("#role-list-collapse").on('shown.bs.collapse', () => {
    $("#role-list .icon-show").toggleClass('d-none');
});