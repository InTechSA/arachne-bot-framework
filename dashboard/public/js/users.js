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
    const username = $("#new-user-form #new-user-name").val();
    const usernameRegex = /^[a-zA-Z\u00C0-\u017F0-9.\-' ]{3,50}$/;
    if (!usernameRegex.test(username)) {
        return displayModalAlert("#new-user-modal", {
            title: "Invalid username",
            message: "Username should not be between 3 and 50 characters, and should not contains special chars."
        });
    }

    $.ajax({
        method: "POST",
        baseUrl: base_url,
        url: "/users/",
        data: { user_name: username },
        dataType: "json",
        success: function(json) {
          console.log(json);
          if (json.success) {
            $("#new-user-modal").modal('hide');
            notifyUser({
              title: "User created",
              message: `Created user ${username}`,
              type: "success",
              delay: 5
            });
          } else {
            if (json.errors) {
                return displayModalAlert("#new-user-modal", {
                    title: json.errors[0].title || "Couldn't create error.",
                    message: json.errors[0].message || "Creation rejected."
                });
            }
          }
        },
        error: function(err) {
          return displayModalAlert("#new-user-modal", {
            title: "Could not create user.",
            message: "Couldn't create user (server or network error)."
        });
        }
      })
});

function deleteUser(button) {
    notifyUser({
        title: "Not implemented",
        message: "You can't delete users yet.",
        type: "warning"
    });
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