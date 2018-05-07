const base_url = "/"

/**
 * Log out user from dashboard, clear session.
 */
function logout() {
  console.log("[INFO] Logging out user. Clearing session.");

  localStorage.setItem("user_token", null);
  Cookies.remove('user_token');

  location.reload();
};
