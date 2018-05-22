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
    notifyUser({
        title: "Not implemented",
        message: "You can't add users yet.",
        type: "warning"
    });
}

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