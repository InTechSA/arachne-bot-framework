function skillToggle(skillButton) {
  let skill = $(skillButton).data('skill');
  let status = $(skillButton).data('active');

  if (skill) {
    $.ajax({
      type: "POST",
      baseUrl: base_url,
      url: `/skills/${skill}/${status ? "off" : "on"}`,
      dataType: 'json',
      success: function(json) {
        console.log(json);
        if (json.active) {
          $(skillButton).attr('data-active', true);
          $(skillButton).data('active', true);
          $(skillButton)
            .find('[data-fa-i2svg]')
            .toggleClass("fa-toggle-on")
            .toggleClass("fa-toggle-off");
          $(skillButton)
            .toggleClass("text-success")
            .toggleClass("text-danger");
          $(skillButton).attr('title', 'Deactivate skill');
          $(skillButton).attr('aria-label', 'Deactivate skill');
        } else {
          $(skillButton).attr('data-active', false);
          $(skillButton).data('active', false);
          $(skillButton)
            .find('[data-fa-i2svg]')
            .toggleClass("fa-toggle-off")
            .toggleClass("fa-toggle-on");
          $(skillButton)
            .toggleClass("text-danger")
            .toggleClass("text-success");
          $(skillButton).attr('title', 'Activate skill');
          $(skillButton).attr('aria-label', 'Activate skill');
        }
      },
      error: function(err) {
        console.log(err)
      }
    });
  }
};

function toggleSkillDetail(skillName) {
  $(`#detail-${skillName}`).on('show.bs.collapse', () => {
    $(`#skill-${skillName} .displayer`)
      .find('[data-fa-i2svg]')
      .toggleClass("fa-caret-down")
      .toggleClass("fa-caret-up");
    $(`#detail-${skillName}`).off('hide.bs.collapse');
    $(`#detail-${skillName}`).off('show.bs.collapse');
  });
  $(`#detail-${skillName}`).on('hide.bs.collapse', () => {
    $(`#skill-${skillName} .displayer`)
      .find('[data-fa-i2svg]')
      .toggleClass("fa-caret-up")
      .toggleClass("fa-caret-down");
    $(`#detail-${skillName}`).off('hide.bs.collapse');
    $(`#detail-${skillName}`).off('show.bs.collapse');
  });

  $(`#detail-${skillName}`).collapse('toggle');
}

function reloadSkill(skillButton) {
  let skill = $(skillButton).data('skill');

  if (skill) {
    $(skillButton).find('[data-fa-i2svg]').toggleClass('fa-spin');

    setTimeout(() => {
      $.ajax({
        type: "POST",
        baseUrl: base_url,
        url: `/skills/${skill}/reload`,
        dataType: 'json',
        success: function(json) {
          console.log(json);
          if (json.success) {
            notifyUser({
              title: `Skill ${skill} reloaded!`,
              message: "",
              type: "info",
              seconds: 3
            });
          }
          $(skillButton).find('[data-fa-i2svg]').toggleClass('fa-spin');
        },
        error: function(err) {
          console.log(err)
          $(skillButton).find('[data-fa-i2svg]').toggleClass('fa-spin');
        }
      });
    }, 2000);
  }
}

function deleteSkill(skillButton) {
  let skill = $(skillButton).data('skill');
  if (skill) {
    console.log("Delete " + skill);

    $.ajax({
      baseUrl: base_url,
      type: "DELETE",
      url: `/skills/${skill}`,
      dataType: 'json',
      success: function(json) {
        console.log(json)
        if (json.success) {
          $('#skill-'+skill).remove();
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
        console.log(err)
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
