function toggleConnectorDetail(connectorId) {
  // Get Connector details
  $.ajax({
    type: "GET",
    baseUrl: base_url,
    url: `/connectors/${connectorId}`,
    dataType: "json",
    success: (json) => {
      $(`#detail-${connectorId} .token`).text(json.connector.token);
      if (json.connector.ip) {
        $(`#detail-${connectorId} .ip`).text(json.connector.ip);
        $(`#detail-${connectorId} .cancel`).attr("data-current", json.connector.ip);
        $(`#detail-${connectorId} .cancel`).data("data-current", json.connector.ip);
        $(`#detail-${connectorId} .restrained`).show();
      } else {
        $(`#detail-${connectorId} .restrained`).hide();
      }

      $(`#detail-${connectorId}`).on('show.bs.collapse', () => {
        $(`#connector-${connectorId} .displayer`)
          .find('[data-fa-i2svg]')
          .toggleClass("fa-caret-down")
          .toggleClass("fa-caret-up");
        $(`#detail-${connectorId}`).off('hide.bs.collapse');
        $(`#detail-${connectorId}`).off('show.bs.collapse');
      });
      $(`#detail-${connectorId}`).on('hide.bs.collapse', () => {
        $(`#connector-${connectorId} .displayer`)
          .find('[data-fa-i2svg]')
          .toggleClass("fa-caret-up")
          .toggleClass("fa-caret-down");
        $(`#detail-${connectorId}`).off('hide.bs.collapse');
        $(`#detail-${connectorId}`).off('show.bs.collapse');
      });
      $(`#detail-${connectorId}`).collapse('toggle');
    },
    error: (error) => {
      notifyUser({
        title: "Error",
        message: "Could not retrieve connector details.",
        delay: 2,
        type: "error"
      })
    }
  });
}

function refreshToken(button) {
  $(button).find('[data-fa-i2svg]').toggleClass('fa-spin');

  setTimeout(() => {
    // Refresh Connector token
    $.ajax({
      type: "POST",
      baseUrl: base_url,
      url: `/connectors/${$(button).data('connector')}/token`,
      dataType: "json",
      success: (json) => {
        $(button).find('[data-fa-i2svg]').toggleClass('fa-spin');
        $(`#detail-${$(button).data('connector')} .token`).text(json.connector.token);
      },
      error: (error) => {
        $(button).find('[data-fa-i2svg]').toggleClass('fa-spin');
        notifyUser({
          title: "Error",
          message: "Could not refresh connector token.",
          delay: 2,
          type: "error"
        })
      }
    });
  }, 1000);
}

function editIp(button) {
  let connectorId = $(button).data('connector');
  $(`#detail-${connectorId} .edit`).hide()
  $(`#detail-${connectorId} .save`).show()
  $(`#detail-${connectorId} .cancel`).show()
  $(`#detail-${connectorId} .ip`).attr("contenteditable", true);
}

function saveIp(button) {
  let connectorId = $(button).data('connector');
  let newIp = $(`#detail-${connectorId} .ip`).text();

  $.ajax({
    type: "PUT",
    baseUrl: base_url,
    url: `/connectors/${connectorId}`,
    data: { address: newIp },
    dataType: "json",
    success: (json) => {
      $(`#detail-${connectorId} .edit`).show()
      $(`#detail-${connectorId} .save`).hide()
      $(`#detail-${connectorId} .cancel`).hide()
      $(`#detail-${connectorId} .ip`).attr("contenteditable", false);
      notifyUser({
        title: "IP updated",
        type: "success",
        message: "Updated Id address",
        delay: 2
      });
    },
    error: (err) => {

    }
  });
}

function cancelIp(button) {
  let connectorId = $(button).data('connector');
  $(`#detail-${connectorId} .ip`).text($(button).data('current'));
  $(`#detail-${connectorId} .edit`).show()
  $(`#detail-${connectorId} .save`).hide()
  $(`#detail-${connectorId} .cancel`).hide()
  $(`#detail-${connectorId} .ip`).attr("contenteditable", false);
}

function toggleConnector(button) {
  let connector = $(button).attr('data-connector');
  let status = $(button).attr('data-active');
  
  // Toggle Connector status
  $.ajax({
    type: "POST",
    baseUrl: base_url,
    url: `/connectors/${connector}/toggle/${status == "on" ? "off" : "on"}`,
    dataType: "json",
    success: (json) => {
      if (json.connector.status) {
        $(button).attr('data-active', "on");
        $(button)
          .find('[data-fa-i2svg]')
          .toggleClass("fa-toggle-on")
          .toggleClass("fa-toggle-off");
        $(button)
          .toggleClass("text-success")
          .toggleClass("text-danger");
        $(button).attr('title', 'Deactivate connector');
        $(button).attr('aria-label', 'Deactivate connector');
      } else {
        $(button).attr('data-active', "off");
        $(button)
          .find('[data-fa-i2svg]')
          .toggleClass("fa-toggle-off")
          .toggleClass("fa-toggle-on");
        $(button)
          .toggleClass("text-danger")
          .toggleClass("text-success");
        $(button).attr('title', 'Activate connector');
        $(button).attr('aria-label', 'Activate connector');
      }
    },
    error: (error) => {
      notifyUser({
        title: "Error",
        message: "Could not toggle connector status.",
        delay: 2,
        type: "error"
      })
    }
  });
}

function deleteConnector(button) {
  // Delete Connector
  $.ajax({
    type: "DELETE",
    baseUrl: base_url,
    url: `/connectors/${$(button).data('connector')}`,
    dataType: "json",
    success: (json) => {
      $(`#connector-${$(button).data('connector')}`).remove();
      notifyUser({
        title: "Connector revoked",
        message: "We will ignore all request from this source.",
        delay: 2,
        type: "success"
      })
    },
    error: (error) => {
      notifyUser({
        title: "Error",
        message: "Could not remove connector.",
        delay: 2,
        type: "error"
      });
    }
  });
}

$("#new-connector").click((event) => {
  event.preventDefault();
  displayNewConnectorModal();
});

function displayNewConnectorModal() {
  $("#new-connector-form #new-connector-name").val('');
  $("#new-connector-form #new-connector-ip").val('');
  $("#new-connector-modal").modal('show');
}

$("#new-connector-form").submit((event) => {
  event.preventDefault();

  let name = $("#new-connector-form #new-connector-name").val();
  let ip = $("#new-connector-form #new-connector-ip").val();

  if (name.length > 0) {
    // Create connector
    $.ajax({
      type: "PUT",
      baseUrl: base_url,
      url: '/connectors',
      data: { name: name, address: ip || ""},
      dataType: "json",
      success: (json) => {
        location.reload();
      },
      error: (err) => {
        let message = "An error occured.";
        if (err.responseJSON) {
          message = err.responseJSON.message;
        }
        notifyUser({
          title: "Couldn't add connector.",
          message: message,
          type: "error",
          delay: 2
        })
      }
    });
  } else {
    // alert
  }
  console.log("new !")
})
