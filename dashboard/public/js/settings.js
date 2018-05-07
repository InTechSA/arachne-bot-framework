$("#modify-username").submit((event) => {
  event.preventDefault();
  let username = $("#new-username").val();
  let usernameRegex = /^[0-9a-zA-Z\u00E0-\u00FC -_]{3,30}$/;

  if (!usernameRegex.test(username)) {
    notifyUser({
      title: "Invalid username.",
      message: "",
      delay: 2,
      type: "error"
    });
  } else {
    $.ajax({
      method: "PUT",
      baseUrl: base_url,
      url: "/dashboard/settings/username",
      data: { username: username },
      dataType: "json",
      success: (json) => {
        notifyUser({
          title: "Username modified.",
          message: "",
          delay: 2,
          type: "success"
        });
      },
      error: (err) => {
        if (err.responseJSON) {
          notifyUser({
            title: "Can't update username.",
            message: err.responseJSON.message,
            type: "error",
            delay: 2
          })
        } else {
          notifyUser({
            title: "Can't update username.",
            message: "An error occured.   ",
            type: "error",
            delay: 2
          })
        }
      }
    })
  }
});

$("#modify-password").submit((event) => {
  event.preventDefault();
  let currentPassword = $("#current-password").val();
  let newPassword = $("#new-password").val();
  let confirmPassword = $("#confirm-password").val();
  let passwordRegex = /^[0-9a-zA-Z\u00E0-\u00FC!@#{}~"'\(\[|\\^=+\]\)-_]{8,30}$/;

  if (!passwordRegex.test(newPassword)) {
    notifyUser({
      title: "Invalid new password.",
      message: "Password must contains only letters, digits, some special characters, from 8 to 30 characters.",
      delay: 5,
      type: "error"
    });
  } else if (newPassword !== confirmPassword) {
    notifyUser({
      title: "Password confirmation didn't match.",
      message: "",
      delay: 5,
      type: "error"
    });
  } else {
    $.ajax({
      method: "PUT",
      baseUrl: base_url,
      url: "/dashboard/settings/password",
      data: { current_password: currentPassword, new_password: newPassword },
      dataType: "json",
      success: (json) => {
        notifyUser({
          title: "Password updated.",
          message: "",
          delay: 2,
          type: "success"
        });
      },
      error: (err) => {
        if (err.responseJSON) {
          notifyUser({
            title: "Can't update password.",
            message: err.responseJSON.message,
            type: "error",
            delay: 2
          })
        } else {
          notifyUser({
            title: "Can't update password.",
            message: "An error occured.   ",
            type: "error",
            delay: 2
          })
        }
      }
    })
  }
});
