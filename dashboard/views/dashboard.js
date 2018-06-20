let currentThread = null;
$('#chat-form').submit((event) => {
  event.preventDefault();
  let message = $("#chat").val().trim();
  let bot_token = $("#chat").data('token');
  if (message.length <= 0) {
    return;
  }

  if (currentThread) {
    $.ajax({
      type: "POST",
      url: "/converse",
      data: { thread_id: currentThread, phrase: message, token: bot_token},
      dataType: 'json',
      success: function(json) {
        console.log(json)
        $("#chat").val('');
        $("#bot-response #source").text(json.source)
        if (json.message.text) {
          $("#bot-response #message").html(formatText(json.message.text));
        } else {
          $("#bot-response #message").text("Skill returned a message with no text. This interface does not support attachments.");
        }
        if (json.message.interactive) {
          currentThread = json.message.thread.id;
        } else {
          currentThread = null;
        }
      },
      error: function(err) {
        console.log(err)
        $("#chat").val('');
        currentThread = null;
        if (json = err.responseJSON) {
          $("#bot-response #source").text(json.source);
          if (json.message.text) {
            $("#bot-response #message").html(formatText(json.message.text));
          } else {
            $("#bot-response #message").text("Skill returned a message with no text. This interface does not support attachments.");
          }
        } else {
          console.log(err)
        }
      }
    });
  } else {
    if (message.startsWith("!")) {
      // Send to commad endpoint.
      console.log("Message sent to Command: " + message.substring(1));

      $.ajax({
        type: "POST",
        url: "/command",
        data: { command: message.substring(1), token: bot_token },
        dataType: 'json',
        success: function(json) {
          console.log(json)
          $("#chat").val('');
          $("#bot-response #source").text(json.source)
          if (json.message.text) {
            $("#bot-response #message").html(formatText(json.message.text));
          } else {
            $("#bot-response #message").text("Skill returned a message with no text. This interface does not support attachments.");
          }
          if (json.message.interactive) {
            currentThread = json.message.thread.id;
          } else {
            currentThread = null;
          }
        },
        error: function(err) {
          $("#chat").val('');
          currentThread = null;
          if (json = err.responseJSON) {
            $("#bot-response #source").text(json.source);
            if (json.message.text) {
              $("#bot-response #message").html(formatText(json.message.text));
            } else {
              $("#bot-response #message").text("Skill returned a message with no text. This interface does not support attachments.");
            }
          } else {
            console.log(err)
          }
        }
      });
    } else {
      // Send to NLP endpoint.
      console.log("Message sent to NLP: " + message);

      $.ajax({
        type: "POST",
        url: "/nlp",
        data: { phrase: message, token: bot_token },
        dataType: 'json',
        success: function(json) {
          console.log(json)
          $("#chat").val('');
          $("#bot-response #source").text(json.source)
          if (json.message.text) {
            $("#bot-response #message").html(formatText(json.message.text));
          } else {
            $("#bot-response #message").text("Skill returned a message with no text. This interface does not support attachments.");
          }
          if (json.message.interactive) {
            currentThread = json.message.thread.id;
          } else {
            currentThread = null;
          }
        },
        error: function(err) {
          console.log(err);
          $("#chat").val('');
          currentThread = null;
          if (json = err.responseJSON) {
            $("#bot-response #source").text(json.source);
            if (json.message.text) {
              $("#bot-response #message").html(formatText(json.message.text));
            } else {
              $("#bot-response #message").text("Skill returned a message with no text. This interface does not support attachments.");
            }
          } else {
            console.log(err)
          }
        }
      });
    }
  }
});

function activateSkill(event) {
  let skill = $(event.target).data('skill');
  if (skill) {
    console.log("Activate " + skill);

    $.ajax({
      type: "POST",
      url: `/skills/${skill}/on`,
      dataType: 'json',
      success: function(json) {
        console.log(json)
        $(event.target).removeClass("skill-activate btn-outline-success");
        $(event.target).addClass("skill-deactivate btn-outline-danger");
        $(event.target).text("Deactivate");
        $(event.target).off('click');
        $(event.target).click(deactivateSkill);
      },
      error: function(err) {
        console.log(err)
      }
    });
  }
};

function deactivateSkill(event) {
  let skill = $(event.target).data('skill');
  if (skill) {
    console.log("Deactivate " + skill);

    $.ajax({
      type: "POST",
      url: `/skills/${skill}/off`,
      dataType: 'json',
      success: function(json) {
        console.log(json)
        $(event.target).removeClass("skill-deactivate btn-outline-danger");
        $(event.target).addClass("skill-activate btn-outline-success");
        $(event.target).text("Activate");
        $(event.target).off('click');
        $(event.target).click(activateSkill);
      },
      error: function(err) {
        console.log(err)
      }
    });
  }
}

function deleteSkill(event) {
  let skill = $(event.target).data('skill');
  if (skill) {
    console.log("Delete " + skill);

    $.ajax({
      type: "DELETE",
      url: `/skills/${skill}`,
      dataType: 'json',
      success: function(json) {
        console.log(json)
        if (json.success) {
          $('#skill-'+skill).remove();
          delete skills[skill];
          notifyUser({
            title: "Skill deleted!",
            message: "Successfully deleted " + skill,
            type: "success",
            delay: 3
          });
        } else {
          notifyUser({
            title: "Couldn't delete " + skill,
            message: "Impossible to delete " + skill,
            type: "error",
            delay: 3
          });
        }
      },
      error: function(err) {
        notifyUser({
          title: "Couldn't delete " + skill,
          message: "Impossible to delete " + skill,
          type: "error",
          delay: 3
        });
      }
    });
  }
}

$('.skill-activate').click(activateSkill);

$('.skill-deactivate').click(deactivateSkill);

function formatText(text) {
  // Remove html tags.
  let formatted = text.replace(/<(.|\n)*?>/, "");
  formatted = formatted.replace(/( |\\n|[^a-zA-Z0-9\u00C0-\u017F])\*(.*?)\*( |[^a-zA-Z0-9\u00C0-\u017F])/g, "$1<strong>$2</strong>$3");
  formatted = formatted.replace(/\[b\](.*?)\[\/b\]/g, "<strong>$1</strong>");
  formatted = formatted.replace(/( |\\n|[^a-zA-Z0-9\u00C0-\u017F])\_(.*?)\_( |[^a-zA-Z0-9\u00C0-\u017F])/g, "$1<em>$2</em>$3");
  formatted = formatted.replace(/\[i\](.*?)\[\/i\]/g, "<em>$1</em>");
  return formatted;
};
