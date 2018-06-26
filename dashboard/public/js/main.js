const base_url = "/";

// Power mode, unleash the power of the troll master in the dashboard.
// This can be activated in the browser console with UNLIMITEDPOWER = true;
// The Power Mode uses experimental features like speech synthetisis.
// Therefore it will not work on all browsers.
let UNLIMITEDPOWER = false;

/**
 * Log out user from dashboard, clear session.
 */
function logout() {
  console.log("[INFO] Logging out user. Clearing session.");

  localStorage.setItem("user_token", null);
  Cookies.remove('user_token');

  location.reload();
}
