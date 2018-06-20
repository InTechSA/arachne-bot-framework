window.onload = init;

window.onresize = () => {
    manual.display();
}

class Help {
    constructor(element) {
        this.skills = [];
        this.element = element;
    }

    loadJSON(json) {
        this.loadSkills(json.skills)
    }

    loadSkills(skills) {
        if (!Array.isArray(skills)) {
            throw new Error("skills must be a valid JSON array.");
        }
        this.skills = skills;
    }

    display(mode) {
        switch (mode) {
            case "all":
                this.displayAll();
                break;
            case "explore":
            default:
                this.displayExplore();
                break;
        }
    }

    displayAll() {
        $(this.element).empty();
    }

    displayExplore() {
        $(this.element).empty();

        // Responsiveness
        let columns = 2;
        const width = $(window).width();
        
        if (width >= 1500) {
            columns = 5;
        } else if (width >= 1200) {
            columns = 4;
        } else if (width >= 992) {
            columns = 3;
        } else if (width >= 768) {
            columns = 2;
        } else if (width >= 576) {
            columns = 1;
        } else {
            columns = 1;
        }

        this.skills.sort(function(a, b){
            if(a.name < b.name) return -1;
            if(a.name > b.name) return 1;
            return 0;
        }).forEach((skill, i) => {

            if (i % columns === 0) {
                $(this.element).append(`
                    <div class="row justify-content-md-center" id="skillrow-${Math.floor(i / columns)}">
                    </div>
                `.trim());
            }

            $(`${this.element} > #skillrow-${Math.floor(i / columns)}`).append(`
                <div class="card m-1" style="width: ${columns > 1 ? "18rem" : "100%"};">
                    <div class="card-body">
                        <h5 class="card-title">${text(skill.name)}</h5>
                        <h6 class="card-subtitle mb-2 ${skill.active ? "text-success" : "text-danger"}">${skill.active ? "active" : "inactive"}</h6>
                        <p class="card-text">${text(skill.description || "No description.")}</p>
                    </div>
                    <div class="list-group list-group-flush">
                        ${skill.commands.map(command => `
                            <a href="#" class="list-group-item list-group-item-action flex-column align-items-start" onClick="detailCommand(event, this)" data-command="${command.cmd}">
                                <div class="d-flex w-100 justify-content-between">
                                    <h5 class="mb-1">${text(command.cmd)}</h5>
                                </div>
                                <p class="mb-1">${text(command.help.description) || "No description"}</p>
                            </a>
                        `)}
                    </div>
                    <div class="card-body text-right">
                        <a href="#" class="card-link" onClick="detailSkill(event, this)" data-skill="${skill.name}">Learn More</a>
                    </div>
                </div>
            `);
        });
    }

    displaySkillModal(name) {
        const skill = this.skills.find(skill => skill.name === name);
        if (!skill) {
            throw new Error("No skill found.");
        }
        console.log(skill);
        $("#skill-modal .modal-dialog").html(`
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="skill-modal-title">${skill.name}</h2>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p>${text(skill.description || "No description")}</p>

                    <h3>Commands</h3>
                    <div class="list-group list-group-flush">
                        ${skill.commands.map(command => `
                            <a href="#" class="action list-group-item list-group-item-action flex-column align-items-start" onClick="detailCommand(event, this)" data-command="${command.cmd}">
                                <div class="d-flex w-100 justify-content-between">
                                    <h4 class="mb-1">${text(command.cmd)}</h4>
                                </div>
                                <p class="mb-1">${text(command.help.description) || "No description"}</p>

                                <h5>Subcommands</h5>
                                ${command.help.subcommands ? `
                                    <ul class="list-group list-group-flush">
                                        ${command.help.subcommands.map(subcommand => `
                                            <li class="list-group-item"><strong>${subcommand.cmd}</strong> ${text("→ " + subcommand.description || "")}</li>
                                        `).join("\n")}
                                    </ul>
                                ` : ""}

                                <hr/>
                                <h5>Examples</h5>
                                ${command.help.examples ? `
                                    <ul class="list-group list-group-flush">
                                        ${command.help.examples.map(example => `
                                            <li class="list-group-item"><code>${text(example.phrase)}</code> → <em>${text(example.action)}</em></li>
                                        `).join("\n")}
                                    </ul>
                                ` : ""}
                            </div>
                        `)}
                    </a>
                </div>
            </div>
        `);

        $('#skill-modal').modal("show");
    }

    displayCommandModal(cmd) {
        const skill = this.skills.find(skill => skill.commands && skill.commands.find(command => command.cmd === cmd));
        if (!skill || !skill.commands) {
            throw new Error("No command found.");
        }

        const command = skill.commands.find(command => command.cmd === cmd);
        if (!command) {
            throw new Error("No command found.");
        }

        console.log(command);
        $("#skill-modal .modal-dialog").html(`
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="command-modal-title">
                        <strong>${command.cmd}</strong> of skill <em>${skill.name}</em></em>
                    </h2>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <a href="#" data-skill="${skill.name}" onClick="detailSkill(event, this)">Back to Skill</a>
                    <hr/>

                    <p class="mb-1">${text(command.help.description) || "No description"}</p>

                    <h3>Subcommands</h3>
                    ${command.help.subcommands ? `
                        <div class="list-group list-group-flush">
                            ${command.help.subcommands.map(subcommand => `
                                <div class="list-group-item">
                                    <h4>${subcommand.cmd}</h4>
                                    <p class="lead">${text(subcommand.description || "No description")}</p>
                                    
                                    ${subcommand.parameters ? `
                                        <h5>Parameters<h5>
                                        <ul class="list-group list-group-flush">
                                            ${subcommand.parameters.map(parameter => `
                                                <li class="list-group-item small">
                                                    <span style="text-decoration: underlined">${text(parameter.name)}:</span>
                                                    <em class="pl-5">${text(parameter.description || "")}</em>
                                                    <br/>
                                                    <p class="pl-5">${text(parameter.example || "")}</p>
                                                </li>
                                            `).join("\n")}
                                        </ul>
                                    `: ""}

                                    ${subcommand.examples ? `
                                        <h5>Examples<h5>
                                        <ul class="list-group list-group-flush">
                                            ${subcommand.examples.map(example => `
                                                <li class="list-group-item small"><code>${text(example.phrase)}</code> → <em>${text(example.action)}</em></li>
                                            `).join("\n")}
                                        </ul>
                                    `: ""}

                                </div>
                            `).join("\n")}
                        </div>
                    ` : ""}

                    <hr/>
                    <h3>Examples</h3>
                    ${command.help.examples ? `
                        <ul class="list-group list-group-flush">
                            ${command.help.examples.map(example => `
                                <li class="list-group-item"><code class="small">${text(example.phrase)}</code> → <em>${text(example.action)}</em></li>
                            `).join("\n")}
                        </ul>
                    ` : ""}
                </div>
            </div>
        `);

        $('#skill-modal').modal("show");
    }
}

const manual = new Help("#manual");

let skills = [];

function init(ev) {
    console.log("Loading manual from API...");
    $.ajax({
        method: "GET",
        baseUrl: base_url,
        url: '/help/skills',
        success: (json) => {
            console.log("Manual received, parsing data.")
            manual.loadSkills(json.skills);
            manual.display();
        },
        error: (err) => {
            console.error("An error occured while fetching the manual!");
            console.error(err);
        }
    });
}

$('#explore').click(ev => {
    manual.display("explore");
});

$('#all').click(ev => {
    manual.display("all");
});


function detailCommand(event, button) {
    event.preventDefault();

    const command = $(button).data("command");
    manual.displayCommandModal(command);
}

function detailSkill(event, button) {
    event.preventDefault();

    const skill = $(button).data("skill");
    manual.displaySkillModal(skill);
}

function text(unsafeText) {
    const text = document.createTextNode(unsafeText);
    const p = document.createElement('p');
    p.appendChild(text);
    return p.innerHTML;
}