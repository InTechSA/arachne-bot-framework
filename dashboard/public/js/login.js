$("#signin-form").submit((event) => {
  event.preventDefault();
  let userName = $("#signin-form #input-username").val();
  let password = $("#signin-form #input-password").val();
  let keepLoggedIn = $("#signin-form #remember").is(":checked");

  $("#signin-form #input-password").val('');

  if (userName.length > 0 && password.length > 0) {
    $.ajax({
      method: "POST",
      baseUrl: base_url,
      url: "/login",
      data: { user_name: userName, password: password },
      dataType: "json",
      success: function(json) {
        if (json.success) {
          // Store token to local storage
          localStorage.setItem("user_token", json.token);
          // Store token in cookies
          if (keepLoggedIn) {
            Cookies.set('user_token', json.token, { expires: 31 }); //TODO: Add ";secure";
          } else {
            Cookies.set('user_token', json.token); //TODO: Add ";secure";
          }
          window.location.replace("/dashboard");
        }
      },
      error: function(err) {
        console.log(err);
      }
    })
  }
});
