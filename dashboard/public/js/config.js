function editField(button) {
    const field = $(button).data('field');
    $.ajax({
        method: "GET",
        baseUrl: base_url,
        url: '/configuration/'+field,
        success: (json) => {
            $('#edit-modal .modal-title').text('Edit ' + field);
            $('#edit-modal .field-title').text(field);
            $('#edit-modal #edit-field').attr('placeholder', json.value);
            $('#edit-modal #edit-field').val(json.value);
            $('#edit-modal').modal('show');     
        },
        error: (error) => {
            notifyUser({
                title: "Could not get configuration.",
                message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                type: "error",
                delay: 2
            });
        }
    });
}

$("#edit-form").submit(event => {
    event.preventDefault();
    const field = $('#edit-modal .field-title').text();
    const value = $('#edit-modal #edit-field').val();
    $.ajax({
        method: "PUT",
        baseUrl: base_url,
        url: '/configuration/'+field,
        data: {
            value: value
        },
        success: (json) => {
            $('#' + field + " .current").text(value);
            $('#edit-modal').modal('hide');
            setTimeout(() => {
                $("#reload-alert").show();
            }, 500);
        },
        error: (error) => {
            notifyUser({
                title: "Could not update configuration.",
                message: error.responseJSON ? error.responseJSON.message : "Server or network error.",
                type: "error",
                delay: 2
            });
        }
    });
});

function reloadBrain() {
    $.ajax({
      baseUrl: base_url,
      type: "POST",
      url: `/reload`,
      dataType: 'json',
      success: function(json) {
        console.log(json)
        if (json.success) {
          notifyUser({
            title: "Brain reloaded",
            message: "Successfully reloaded brain and all skills.",
            type: "success",
            delay: 3
          });
          location.reload();
        } else {
          notifyUser({
            title: "Couldn't reload bot.",
            message: "An unkown error occured.",
            type: "error",
            delay: 3
          });
          location.reload();
        }
      },
      error: function(err) {
        notifyUser({
          title: "Couldn't reload bot.",
          message: "An unkown error occured.",
          type: "error",
          delay: 3
        });
      }
    });
  }
  
  $("#reload-brain").click(reloadBrain);