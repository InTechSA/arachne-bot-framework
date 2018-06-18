/*
  SKILL : github
  AUTHOR : Anonymous
  DATE : 14/05/2018
*/

module.exports = (skill) => {
    function helpMessage() {
        return {
            title: "GIT ♦ Help",
            text: "> `!git attach <hookName>` to attach a webhook.\n> `!git detach <hookName>` to detach a webhook.\n> `!git list` to list hooks.\n\n(Hook names cannot contain whitespaces)"
        }
    }

    skill.addCommand("git", "git", ({ phrase, data }) => {
        return Promise.resolve().then(() => {
            const args = phrase.split(" ");
            if (args.length > 0) {
                let hookName;
                switch (args[0]) {
                    case "attach":
                        // attach
                        if (!data.channel) {
                            return {
                                message: {
                                    title: "Git ♦ Cannot create hook.",
                                    text: "Skill can not identify this channel. Hook creation cannot fulfill."
                                }
                            };
                        }

                        if (!args[1]) {
                            return {
                                message: {
                                    title: "Git ♦ Missing hook name.",
                                    text: "> `!git attach <hookName>` to create a new hook."
                                }
                            };
                        }

                        hookName = args[1].trim();

                        return skill.getItem("github", "hooks").then((storage) => {
                            let hooks = storage || [];

                            // Search for a hook in this channel with this name.
                            if (hooks.findIndex(hook => hook.channel == data.channel && hook.name == hookName) >= 0) {
                                return {
                                    message: {
                                        title: "Git ♦ Can't create hook.",
                                        text: `There is already a hook with this name in this channel, I can't create a new one, sorry!`,
                                    }
                                };
                            }

                            return skill.createPipe("hookHandler", { withHook: true }).then(pipe => {
                                hooks.push({
                                    channel: data.channel,
                                    id: pipe.hook._id,
                                    pipe: pipe.identifier,
                                    name: hookName
                                });

                                return skill.storeItem("hooks", hooks).then(() => {
                                    return {
                                        message: {
                                            title: "Git ♦ Hook",
                                            text: `Your webhook \`${hookName}\` is ready to alert you! The url is ` + "https://arachne-bot.intech-lab.com/pipes/github/" + pipe.identifier,
                                            request_hook: true,
                                            hook: pipe.hook
                                        }
                                    };
                                });
                            })
                        });
                    case "detach":
                        if (!args[1]) {
                            return {
                                message: {
                                    title: "Git ♦ Detach hooks.",
                                    text: "> `!git detach <hookid>` to detach a hook. Type `!git list` to get list of hooks in this channel."
                                }
                            };
                        }
                        hookName = args[1].trim();
                        // detach
                        if (!data.channel) {
                            return {
                                message: {
                                    title: "Git ♦ Cannot detach hook.",
                                    text: "Skill can not identify this channel. Hook deletion cannot fulfill."
                                }
                            };
                        }
                        return skill.getItem("github", "hooks").then((hooks) => {
                            let hookIndex = hooks.findIndex(hook => hook.channel == data.channel && hook.name == hookName);
                            if (hookIndex < 0) {
                                return {
                                    message: {
                                        title: "Git ♦ Cannot detach hook.",
                                        text: "I can't identify the hook to delete, make sure the hook name is correct."
                                    }
                                };
                            }

                            return skill.removeHook(hooks[hookIndex].id).then(() => {
                                hooks.splice(hookIndex, 1);
                                return skill.storeItem("github", "hooks", hooks).then(() => {
                                    return {
                                        message: {
                                            title: "Git ♦ Hook deleted.",
                                            text: "The Git Hook in this channel was successfully removed."
                                        }
                                    };
                                })
                            });
                        });
                    case "list":
                        return skill.getItem("github", "hooks").then((hooks) => {
                            const found = hooks.filter(hook => hook.channel == data.channel);
                            return {
                                message: {
                                    title: "Git ♦ Hooks for this channel.",
                                    text: found.map(hook => `• *${hook.name}* - pipe: _${hook.pipe}_.`).join("\n")
                                }
                            };
                        }).catch(() => {
                            return {
                                message: {
                                    title: "Git ♦ Could not get hooks.",
                                    text: "I was unable to get the list of git hooks here, i'm sorry :'("
                                }
                            };
                        });
                    default:
                        //help
                        return {
                            message: helpMessage()
                        };
                }
            } else {
                return {
                    message: helpMessage()
                };
            }
        });
    });

    skill.addIntent("create-git-webhook", "create-git-webhook", ({ entities: { repository: repository = [] }, data }) => {
        if (repository.length === 0) {
            return Promise.resolve({
                message: {
                    text: "I am expecting a repository name for this webhook."
                }
            });
        } else {
            return skill.handleCommand("git", { phrase: `attach ${repository[0]}`, data });    
        }
    });

    skill.addIntent("list-git-webhook", "list-git-webhook", ({ entities, data }) => {
        return skill.handleCommand("git", { phrase: `list`, data });
    });

    skill.addPipe("hookHandler", ({ hookId, data, headers }) => {
        return Promise.resolve().then(() => {
            let message = {};
            if (data.object_kind) {
                // This is a gitlab wehbook event.
                if (data.object_kind === "pipeline") {
                    // This is a pipeline event.
                    if (data.object_attributes.status === "success") {
                        message.title = `Pipeline for ${data.project.name} is successfull.`
                        message.text = `Your pipeline for branch ${data.object_attributes.ref} is a success. It was started by ${data.commit.author.name}.`
                        message.attachments = data.builds.map(build => {
                            return {
                                title: `${build.name} for stage ${build.stage}`,
                                text: `Status: **${build.status}**`,
                                color: build.status == "success" ? "#00AA00" : "#AA0000"
                            }
                        });
                    } else if (data.object_attributes.status === "failed") {
                        message.title = `Pipeline for ${data.project.name} failed.`
                        message.text = `Your pipeline for branch ${data.object_attributes.ref} has failed. It was started by ${data.commit.author.name}.`
                        message.attachments = data.builds.map(build => {
                            return {
                                title: `${build.name} for stage ${build.stage}`,
                                text: `Status: **${build.status}**`,
                                color: build.status == "success" ? "#00AA00" : "#AA0000"
                            }
                        });
                    } else {
                        message.title = `Pipeline for ${data.project.name}: ${data.object_attributes.status}.`
                        message.text = `Your pipeline for branch ${data.object_attributes.ref} returned the code **${data.object_attributes.status}**. It was started by ${data.commit.author.name}.`
                    }
                } else if (data.object_kind === "push") {
                    message.title = `${data.repository.name} ♦ Push event`;
                    message.text = `I detected a push event from ${data.user_name} on branch ${data.ref} of ${data.repository.name}. A total of ${data.total_commits_count} commits were pushed.`;
                    message.attachments = data.commits.map(commit => {
                        return {
                            color: "#2233DD",
                            title: `• ${commit.message.trim()} from ${commit.author.name}`,
                            title_link: commit.url,
                            text: commit.message + "\n\n> Modified:\n" + commit.modified.join(" - ")
                        }
                    });
                } else if (data.object_kind === "merge_request") {
                    if (data.object_attributes.action === "open") {
                        message.attachments = [
                            {
                                title: `${data.repository.name} ♦ Merge request`,
                                text: `I detected a merge request from ${data.user.name} on branch ${data.object_attributes.target_branch} to branch ${data.object_attributes.source_branch} of ${data.repository.name}.`,
                                title_link: data.object_attributes.url,
                                color: "#6600CC"
                            },
                            {
                                title: "Description",
                                text: data.object_attributes.description,
                                color: "#999966"
                            }
                        ]
                    } else if (data.object_attributes.action === "merge") {
                        message.attachments = [{
                            title: `${data.repository.name} ♦ Merge request finished`,
                            text: `The merge request from ${data.user.name} on branch ${data.object_attributes.target_branch} to branch ${data.object_attributes.source_branch} of ${data.repository.name} was closed.`,
                            title_link: data.object_attributes.url,
                            color: "#00DD00"
                        }, {
                            title: "Description",
                            text: data.object_attributes.description,
                            color: "#999966"
                        }]
                    } else {
                        skill.log("Event not supported:" + data.object_attributes.action)
                        // Ignore other events.
                        return;
                    }
                } else {
                    message.title = `${data.object_kind} event detected on ${data.project.name || "a"} repository.`;
                }
            } else {
                message.title = 'Bip bip, activity detected on a repository!';
            }
        }).then(message => {
            return skill.useHook(hookId, message);
        });
    });

}
