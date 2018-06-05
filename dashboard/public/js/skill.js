function clearHooks(button) {
    let skill = $(button).data('skill');
    $.ajax({
        method: 'DELETE',
        baseUrl: base_url,
        url: `/skills/${skill}/hooks`,
        dataType: 'json',
        success: (json) => {
            $('#hooks').text('0');
            notifyUser({
                title: "Hooks cleared!",
                message: "This skill is now empty of any hooks. Users that used this functionnality will have to request new hooks.",
                type: "success",
                delay: "3"
            });
        },
        error: (err) =>{
            console.log(err);
            notifyUser({
                title: "Couldn't clear hooks.",
                message: "Impossible to clear hooks for this skill.",
                type: "error",
                delay: "3"
            });
        }
    })

}

function clearStorage(button) {
    let skill = $(button).data('skill');
    $.ajax({
        method: 'DELETE',
        baseUrl: base_url,
        url: `/skills/${skill}/storage`,
        dataType: 'json',
        success: (json) => {
            $('#storage').text('0');
            notifyUser({
                title: "Storage cleared!",
                message: "This skill is now empty of any storage..",
                type: "success",
                delay: "3"
            });
        },
        error: (err) =>{
            console.log(err);
            notifyUser({
                title: "Couldn't clear hooks.",
                message: "Impossible to clear storage for this skill.",
                type: "error",
                delay: "3"
            });
        }
    })
}

function clearPipes(button) {
    let skill = $(button).data('skill');
    $.ajax({
        method: 'DELETE',
        baseUrl: base_url,
        url: `/skills/${skill}/pipes`,
        dataType: 'json',
        success: (json) => {
            $('#pipes').text('0');
            notifyUser({
                title: "Pipes cleared!",
                message: "This skill has now zero remaining pipes. Users that used this functionnality will have to request new pipes.",
                type: "success",
                delay: "3"
            });
        },
        error: (err) =>{
            console.log(err);
            notifyUser({
                title: "Couldn't clear pipes.",
                message: "Impossible to clear pipes for this skill.",
                type: "error",
                delay: "3"
            });
        }
    })

}

function deleteLogs(skillName) {
    $.ajax({
        method: "DELETE",
        baseUrl: base_url,
        url: "/skills/"+skillName+"/logs",
        dataType: "json",
        success: function(json) {
            location.reload();
        },
        error: function(err) {
        notifyUser({
            title: "Could not delete logs",
            message: err.responseJSON.message || "Unknown error occured",
            type: "error",
            delay: 2
        })
        }
    })
}

function deleteLogsModal(skillName) {
    $.ajax({
        method: "DELETE",
        baseUrl: base_url,
        url: "/skills/"+skillName+"/logs",
        dataType: "json",
        success: function(json) {
            $("#logsForSkill").text("No log for this skill");
            $("#logsSkill").text("No log for this skill");
        },
        error: function(err) {
        notifyUser({
            title: "Could not delete logs",
            message: err.responseJSON.message || "Unknown error occured",
            type: "error",
            delay: 2
        })
        }
    })
}

function loadLogs(skillName) {
    $.ajax({
        method: "GET",
        baseUrl: base_url,
        url: "/skills/"+skillName+"/logs",
        dataType: "json",
        success: function(json) {
            $("#logsForSkill").text(json.logs);
            $("#logsSkill").text(json.logs);
            $("#logsModal").modal("show");
        },
        error: function(err) {
        notifyUser({
            title: "Could not get logs",
            message: err.responseJSON.message || "Unknown error occured",
            type: "error",
            delay: 2
        })
        }
    })
}
    
$('#logsModal').on('shown.bs.modal', (e) => {
    $("#logsForSkill").scrollTop($("#logsForSkill").prop('scrollHeight'));
});

function getLogs(button) {
    let skill = $(button).data('skill');
    $.ajax({
        method: 'GET',
        baseUrl: base_url,
        url: `/skills/${skill}/logs`,
        dataType: 'json',
        success: (json) => {
            var logTab = $('#logsSkill').text(json.logs).split('\n');
            if(logTab.length > 10) {
                logTab.splice(0,logTab.length - 10);
            }
            $('#logsSkill').text(logTab.join('\n'));
        },
        error: (err) =>{
            console.log(err);
            notifyUser({
                title: "Couldn't get logs.",
                message: "Impossible to get logs for this skill.",
                type: "error",
                delay: "3"
            });
        }
    })
}

$("#logsSkill").scrollTop($("#logsSkill").prop('scrollHeight'));