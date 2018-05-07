function notifyUser({ title = "Notification", message = "Here is a notification for you, user!", type = "info", seconds = 10 } = {}) {
  let alertClass;
  switch (type) {
    case "success":
      alertClass = "alert-success";
      break;
    case "info":
      alertClass = "alert-info";
      break;
    case "warning":
      alertClass = "alert-warning";
      break;
    case "error":
      alertClass = "alert-danger";
      break;
    case "light":
    default:
      alertClass = "alert-light";
      break;
  }
  let notificationId = Math.random().toString(36).substr(2, 9);
  let notification = `
    <div id="notification-${notificationId}" class="alert ${alertClass} alert-dismissible fade show notification">
      <h5 class="alert-heading">${title}</h4>
      <p class="mb-0">${message}</p>
      <button class="close" type="button" aria-label="Close" onClick="dismissNotification('${notificationId}')">
        <span aria-hidden="true")>&times;</span>
      </button>
    </div>
  `.trim();
  $('#notifications').append(notification);
  // delay for transition.
  setTimeout(() => {
    $('#notification-' + notificationId).css('transform', 'translateX(-100%)');
    let delay = seconds * 1000;
    if (delay > 0) {
      setTimeout(() => {
        dismissNotification(notificationId);
      }, delay)
    }
  }, 500);
  return notificationId;
};

function dismissNotification(notificationId) {
  if ($('#notification-' + notificationId)) {
    $('#notification-' + notificationId).css('transform', 'translateX(100%)');
    $('#notification-' + notificationId).on("transitionend", () => {
      $('#notification-' + notificationId).remove();
    });
  }
}

$("body").append('<div id="notifications" style="z-index: 1000; position: fixed; right: 0; bottom: 10px;"></div>');
$("head").append('<style>#notifications { min-width: 400px; max-width: 30%; } .notification { transition: transform 0.5s; position: relative; right: -100%; }<style>');
