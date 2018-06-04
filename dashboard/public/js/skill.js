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