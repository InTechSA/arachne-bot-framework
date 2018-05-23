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
  };

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
            $("#user-list").append(`<tr data-user='${user_name}'><th scope='row'>${user_name}</th><td>${json.user.roles.join(", ")}</td><td><i class='text-primary action ml-1 fas fa-eye' title="Manage user" onClick="manageUser(this)" data-user='${user_name}'></i><i class='text-danger action ml-1 fas fa-trash-alt' title="Delete user" onClick="deleteUser(this)" data-user='${user_name}'></i>`.trim())
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
    notifyUser({
        title: "Not implemented",
        message: "You can't create roles yet.",
        type: "warning"
    });
}

function deleteRole(button) {
    notifyUser({
        title: "Not implemented",
        message: "You can't delete roles yet.",
        type: "warning"
    });
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