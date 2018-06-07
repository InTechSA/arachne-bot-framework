const skillNameRegex = /^[a-z\\-]{3,20}$/;

class Skill {
  constructor() {
    this.name = undefined;
    this.intents = {};
    this.commands = {};
    this.interactions = {};
    this.dependencies = [];
    this.code = "";
    this.author = undefined;
    this.secret = {};
  }

  generateCode() {
    let commands = "{}";

    let dependencies = "[";
    for (let i = 0; i < this.dependencies.length; i++) {
      dependencies += `"${this.dependencies[i]}"${i < this.dependencies.length - 1 ? ", " : ""}`;
    }
    dependencies += "]";
    let code = `
/*
  SKILL : ${this.name || "new-skill"}
  AUTHOR : ${this.author || "Anonymous"}
  DATE : ${(new Date()).toLocaleDateString()}
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = ${this.commandString};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = ${this.intentString};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = ${this.interactionString};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ${dependencies};
/* </SKILL DEPENDENCIES> */

// pipes of the skill.
/* <SKILL DEPENDENCIES> */
let pipes = {};
/* </SKILL DEPENDENCIES> */

// Exposing the skill definition.
exports.commands = commands;
exports.intents = intents;
exports.dependencies = dependencies;
exports.interactions = interactions;
exports.pipes = pipes;

/*
  Skill logic begins here.
  You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
*/
/* <SKILL LOGIC> */
const overseer = require('../../overseer');
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.
    `.trim();
    this.code = code;
    return code;
  }

  setName(name) {
    this.name = name;
  }

  /**
    Generate the skill using a template (or from scratch).
  */
  generate(name, template, skills) {
    return new Promise((resolve, reject) => {
      // Check if name is available.
      let trueName = name.toLowerCase();

      if (!skillNameRegex.test(trueName)) {
        return reject({ title: "Invalid skill name.", message: "Name must be lower-case, contain only letters and -." })
      }

      if (Object.keys(skills).includes(trueName)) {
        return reject({ message: "Skill name " + name + " already in use." });
      }

      this.name = name;
      this.dependencies = [];
      this.intents = {};
      this.commands = {};

      switch (template) {
        case "API request":
          this.dependencies = ['request'];
          this.generateCode();
          break;
        default:
          this.generateCode();
          break;
      }

      return resolve();
    });
  }

  /**
    Adds the command to the skill and updates editor.

    Params :
    --------
    command:
      {
        name: String,
        cmd: String,
        execute: String
      }
  */
  addCommand(command) {
    return new Promise((resolve, reject) => {
      // Checks command validity

      // cmd unicity
      // Check in the new edited skill
      for (let com in this.commands) {
        if (this.commands[com].cmd === command.cmd) {
          return reject({
            title: "Command word already used.",
            message: `The command word must be unique to the bot, or conflicts will arise. (Used in this skill).`
          });
        }
      }
      // Check in all skills
      for (let skillName in skills) {
        for (let com in skills[skillName].commands) {
          if (skills[skillName].commands[com].cmd === command.cmd) {
            return reject({
              title: "Command word  already used.",
              message: `The command word must be unique to the bot, or conflicts will arise. (Used in skill ${skillName}).`
            });
          }
        }
      }

      // handler validity
      const functionRegex = /^[a-zA-Z]{3,40}$/;
      if (!functionRegex.test(command.execute)) {
        return reject({
          title: "Invalid handler name.",
          message: "The handler name must follow camelLowerCase (and souldn't contain digits)."
        });
      }

      // Command is valid


      // Add intent to skill and to code
      this.commands[command.name] = command;

      // Add intent definition
      this.code = this.code.replace(/let commands = {(.*|\r|\n|\u2028|\u2029){0,}?};/, `let commands = ${this.commandString};`);

      // Add handler
      let handlerString = `/**
  Handler for command ${command.name} (!${command.cmd}).

  Params :
  --------
    phrase: String
*/
function ${command.execute}({ phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    return resolve({
      message: {
        title: "Not implemented",
        text: "This functionnality is currently not implemented."
      }
    });
  });
}`;
      this.code = this.code.replace(/\/\* <\/SKILL LOGIC> \*\//, "\n" + handlerString + "\n/* </SKILL LOGIC> */");

      editor.setValue(this.code);
      editor.session.setValue(this.code);
      editor.clearSelection();

      return resolve();
    });
  }

  /**
    Adds the intent to the skill and updates editor.

    Params :
    --------
    intent:
      {
        name: String
        slug: String
        handler: String
        expected_entities: [String]
      }
  */
  addIntent(intent) {
    return new Promise((resolve, reject) => {
      // Checks intent validity

      // name unicity
      // Check in the new edited skill
      if (Object.keys(this.intents).includes(intent.name)) {
        // intent name already in use, abort and alert.
        return reject({
          title: "Intent name already in use.",
          message: `The name of the intent must be unique to the bot. (Used in this skill).`
        });
      }
      // Check in all skills
      for (let skillName in skills) {
        if (Object.keys(skills[skillName].intents).includes(intent.name)) {
          // intent name already in use, abort and alert.
          return reject({
            title: "Intent name already in use.",
            message: `The name of the intent must be unique to the bot. (Used in skill ${skillName}).`
          });
        }
      }

      // slug unicity
      // Check in the new edited skill
      for (let int in this.intents) {
        if (this.intents[int].slug === intent.slug) {
          return reject({
            title: "Slug already used.",
            message: `The slug of the intent must be unique to the bot, or conflicts will arise. (Used in this skill).`
          });
        }
      }
      // Check in all skills
      for (let skillName in skills) {
        for (let int in skills[skillName].intents) {
          if (skills[skillName].intents[int].slug === intent.slug) {
            return reject({
              title: "Slug already used.",
              message: `The slug of the intent must be unique to the bot, or conflicts will arise. (Used in skill ${skillName}).`
            });
          }
        }
      }

      // entities validity
      const entityRegex = /^[a-zA-Z\\-]{2,40}$/;
      for (let entity of intent.expected_entities) {
        if (!entityRegex.test(entity)) {
          return reject({
            title: `Invalid entity name : ${entity}.`,
            message: "A valid entity name has no space, no underscore, and no digit."
          });
        }
      }

      // handler validity
      const functionRegex = /^[a-zA-Z]{3,40}$/;
      if (!functionRegex.test(intent.handle)) {
        return reject({
          title: "Invalid handler name.",
          message: "The handler name must follow camelLowerCase (and souldn't contain digits)."
        });
      }

      // Intent is valid


      // Add intent to skill and to code
      this.intents[intent.name] = intent;

      // Add intent definition
      this.code = this.code.replace(/let intents = {(.*|\r|\n|\u2028|\u2029){0,}?};/, `let intents = ${this.intentString};`);

      // Add handler
      let paramsString = `{`;
      for (let entity of intent.expected_entities) {
        paramsString += ` '${entity}': ${entity.replace("-", "")} = {}`
        if (intent.expected_entities.indexOf(entity) < intent.expected_entities.length - 1) {
          paramsString += ","
        }
      }
      paramsString += '}'
      let handlerString = `/**
  Handler for intent ${intent.name} (${intent.slug}).

  Params :
  --------
    entities (Object)
*/
function ${intent.handle}({ entities: ${paramsString}, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    return resolve({
      message: {
        title: "Not implemented",
        text: "This functionnality is currently not implemented."
      }
    });
  });
}`;
      this.code = this.code.replace(/\/\* <\/SKILL LOGIC> \*\//, handlerString + "\n/* </SKILL LOGIC> */");

      editor.setValue(this.code);
      editor.session.setValue(this.code);
      editor.clearSelection();

      return resolve();
    });
  }

  /**
    Adds the intent to the skill and updates editor.

    Params :
    --------
    intent:
      {
        name: String
        slug: String
        handler: String
        expected_entities: [String]
      }
  */
  addInteraction(interaction) {
    return new Promise((resolve, reject) => {
      // Checks intent validity

      // name unicity
      // Check in the new edited skill
      if (Object.keys(this.interactions).includes(interaction.name)) {
        // interaction name already in use, abort and alert.
        return reject({
          title: "Interaction name already in use.",
          message: `The name of the interaction must be unique to the bot. (Used in this skill).`
        });
      }
      // Check in all skills
      for (let skillName in skills) {
        if (Object.keys(skills[skillName].interactions).includes(interaction.name)) {
          // intent name already in use, abort and alert.
          return reject({
            title: "Interaction name already in use.",
            message: `The name of the interaction must be unique to the bot. (Used in skill ${skillName}).`
          });
        }
      }

      // handler validity
      const functionRegex = /^[a-zA-Z]{3,40}$/;
      if (!functionRegex.test(interaction.handle)) {
        return reject({
          title: "Invalid handler name.",
          message: "The handler name must follow camelLowerCase (and souldn't contain digits)."
        });
      }

      // Intent is valid


      // Add intent to skill and to code
      this.interactions[interaction.name] = interaction;

      // Add intent definition
      this.code = this.code.replace(/let interactions = {(.*|\r|\n|\u2028|\u2029){0,}?};/, `let interactions = ${this.interactionString};`);

      // Add handler
      let handlerString = `/**
  Handler for interaction ${interaction.name}.

  Params :
  --------
    phrase: String
*/
function ${interaction.interact}(thread, { phrase, data }) {
  return new Promise((resolve, reject) => {
    /*
      >>> YOUR CODE HERE <<<
      resolve the handler with a formatted message object.
    */
    let continueThreadMode = false;

    if (continueThreadMode) {
      // Return response and continue Conversation on same thread.
      return resolve({
          message: {
              interactive: true,
              thread_id: thread._id,
              title: "Continue conversation",
              text: "Bot response to user answer."
          }
      });
    } else {
      // Close Thread.
      overseer.ThreadManager.closeThread(thread._id).then(() => {
        return resolve({
            message: {
                title: "Closing thread.",
                text: "Bot response to user answer."
            }
        });
      }).catch((e) => {
        return resolve({
            message: {
                title: "Error.",
                text: "Could not close thread, exit conversation mode."
            }
        });
      });
    }

  });
}`;
      this.code = this.code.replace(/\/\* <\/SKILL LOGIC> \*\//, handlerString + "\n/* </SKILL LOGIC> */");

      // Require Overseer if not present.
      if (!/const overseer = require\('\.\.\/\.\.\/overseer'\);/.test(this.code)) {
        this.code = this.code.replace(/\/\* <SKILL LOGIC> \*\//, "/* <SKILL LOGIC> */\nconst overseer = require('../../overseer');\n\n");
      }

      editor.setValue(this.code);
      editor.session.setValue(this.code);
      editor.clearSelection();

      return resolve();
    });
  }

  addOverseer() {
    return new Promise((resolve, reject) => {
      // Require Overseer if not present.
      if (!/const overseer = require\('\.\.\/\.\.\/overseer'\);/.test(this.code)) {
        this.code = this.code.replace(/\/\* <SKILL LOGIC> \*\//, "/* <SKILL LOGIC> */\nconst overseer = require('../../overseer');\n\n");
      }

      editor.setValue(this.code);
      editor.session.setValue(this.code);
      editor.clearSelection();

      return resolve();
    });
  }

  get intentString() {
    let intentString = "{"
    for (let intentName in this.intents) {
      let intent = this.intents[intentName];
      let entities = "[";
      for (let i = 0; i < intent.expected_entities.length; i++) {
        entities += `"${intent.expected_entities[i]}"${i < intent.expected_entities.length - 1 ? ", " : ""}`;
      }
      entities += "]";
      intentString += `
  '${intent.name}': {
    slug: "${intent.slug}",
    handle: ${intent.handle},
    expected_entities: ${entities}
  }`;
      if (Object.keys(this.intents).indexOf(intentName) < Object.keys(this.intents).length - 1) {
        intentString += ","
      }
    }
    intentString += "\n}"
    return intentString;
  }

  get commandString() {
    let commandString = "{"
    for (let commandName in this.commands) {
      let command = this.commands[commandName];
      commandString += `
  '${command.name}': {
    cmd: "${command.cmd}",
    execute: ${command.execute}
  }`;
      if (Object.keys(this.commands).indexOf(commandName) < Object.keys(this.commands).length - 1) {
        commandString += ","
      }
    }
    commandString += "\n}"
    return commandString;
  }

  get interactionString() {
    let interactionString = '{';
    for (let interactionName in this.interactions) {
      let interaction = this.interactions[interactionName];
      interactionString += `
  '${interaction.name}': {
    name: "${interaction.name}",
    interact: ${interaction.interact}
  }`;
      if (Object.keys(this.interactions).indexOf(interactionName) < Object.keys(this.interactions).length - 1) {
        interactionString += ","
      }
    }
    interactionString += "\n}"
    return interactionString;
  }
}

function showEditor() {
  $("#code-alert").hide();
  $("#editor").show();
}

$("#skill-generate").submit(function (event) {
  var id = event.target.id;
  console.log("Generate new skill");
  event.preventDefault();

  $('#skill-generate').hide();

  let skillName = $(`#${id} #skill-name`).val();
  let skillTemplate = $(`#${id} #skill-template`).val();

  skill.generate(skillName, skillTemplate, skills).then(() => {
    $("main h1").text(skill.name);
    $("#skill-toolbox").show();
    $("#left-panel").removeClass("col-md-4");
    $("#left-panel").addClass("col-md-2");
    $("#middle-panel").removeClass("col-md-6");
    $("#middle-panel").addClass("col-md-8");
    let notificationId = notifyUser({
      title: "Skill generated!",
      message: "You can add commands and intents using the left-side panel.",
      type: "success",
      delay: 2
    });
    editor.setValue(skill.code);
    editor.clearSelection();
    showEditor();
  }).catch((err) => {
    $('#skill-generate').show();
    notifyUser({
      title: err.title || "Can't create skill.",
      message: err.message,
      type: "error"
    });
  });
});

function configureSecret() {
  $.ajax({
    type: "GET",
    baseUrl: base_url,
    url: `/skills/${skill.name}/secret`,
    dataType: 'json',
    success: (json) => {
      $("#configure-secret-alert").empty();

      $("#configure-secret-form table tbody").empty();
      if (json.secret) {
        for (let secret of json.secret) {
          $('#configure-secret-form table tbody').append(`<tr><td><input class="form-control key" placeholder="key" value="${secret[0]}"></td><td><input class="form-control value" placeholder="value" value="${secret[1]}"></td><td class="align-middle"><span class="action text-danger" aria-label="Delete secret." title="Delete secret." onClick="deleteSecret(this)"><i class="fas fa-times"></i></span></td></tr>`.trim());
        }
      }

      $('#configure-secret-modal').modal('show');
    },
    error: (err) => {
      console.log(err);
    }
  });
};

function deleteSecret(button) {
  $(button)[0].parentNode.parentNode.remove();
}

function displayConfigureSecretAlert({ title = "Error", message = "Couldn't save secret." } = {}) {
  $("#configure-secret-alert").empty();
  $("#configure-secret-alert").append(`
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <h4 class="alert-heading">${title}</h4>
      <p>${message}</p>
      <button class="close" type="button" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `.trim());
};

// Add a new line to the secrets table in modal.
$("#new-secret").click((event) => {
  $('#configure-secret-form table tbody').append(`<tr><td><input class="form-control key" placeholder="key"></td><td><input class="form-control value" placeholder="value"></td><td class="align-middle"><span class="action text-danger" aria-label="Delete secret." title="Delete secret." onClick="deleteSecret(this)"><i class="fas fa-times"></i></span></td></tr>`.trim());
});

$("#configure-secret-form").submit(function (event) {
  event.preventDefault();

  // Build secret array
  let secrets = [];
  for (let secret of $("#configure-secret-form table tbody tr")) {
    let key = $(secret).find(".key").val();
    let value = $(secret).find(".value").val();
    secrets.push([key, value]);
  }
  $.ajax({
    type: "PUT",
    baseUrl: base_url,
    url: `/skills/${skill.name}/secret`,
    contentType: 'application/json',
    data: JSON.stringify({ secret: secrets }),
    dataType: "json",
    success: (json) => {
      console.log(json);
      $("#configure-secret-modal").modal('hide');
      notifyUser({
        title: "Secret saved!",
        message: "The new secret configuration is saved, and skill was reloaded.",
        type: "success",
        delay: 2
      });
    },
    error: (err) => {
      displayConfigureSecretAlert(err);
    }
  });
});

function addIntent() {
  $("#add-intent-alert").empty();
  $('#add-intent-form #intent-name').val('');
  $('#add-intent-form #intent-slug').val('');
  $('#add-intent-form #intent-entities').val('');
  $('#add-intent-form #intent-handler').val('');
  $('#add-intent-modal').modal('show');
};

function displayAddIntentAlert({ title = "Error", message = "Couldn't create intent." }) {
  $("#add-intent-alert").empty();
  $("#add-intent-alert").append(`
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <h4 class="alert-heading">${title}</h4>
      <p>${message}</p>
      <button class="close" type="button" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `.trim());
};

$("#add-intent-form").submit(function (event) {
  event.preventDefault();
  // Parsing new intent
  let name = $('#add-intent-form #intent-name').val();
  if (!name.startsWith(skill.name + "-")) {
    name = skill.name + "-" + name;
  }
  let slug = $('#add-intent-form #intent-slug').val();
  let entityVal = $('#add-intent-form #intent-entities').val();
  let entities = entityVal.length > 0 ? entityVal.split(", ") : [];
  let handler = $('#add-intent-form #intent-handler').val();

  let intent = {
    name: name,
    slug: slug,
    handle: handler,
    expected_entities: entities
  };

  // SUCCESS ! Let's add the intent to the code
  skill.addIntent(intent).then(() => {
    $("#add-intent-modal").modal("hide");
  }).catch((err) => {
    displayAddIntentAlert(err);
  });
});

function addCommand() {
  $("#add-command-alert").empty();
  $('#add-command-form #command-name').val('');
  $('#add-command-form #command-word').val('');
  $('#add-command-form #command-handler').val('');
  $('#add-command-modal').modal('show');
};

function displayAddCommandAlert({ title = "Error", message = "Couldn't create command." }) {
  $("#add-command-alert").empty();
  $("#add-command-alert").append(`
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <h4 class="alert-heading">${title}</h4>
      <p>${message}</p>
      <button class="close" type="button" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `.trim());
};

$("#add-command-form").submit(function (event) {
  event.preventDefault();
  // Parsing new intent
  let name = $('#add-command-form #command-name').val();
  let word = $('#add-command-form #command-word').val();
  let handler = $('#add-command-form #command-handler').val();

  let command = {
    name: name,
    cmd: word,
    execute: handler
  };

  // SUCCESS ! Let's add the intent to the code
  skill.addCommand(command).then(() => {
    $("#add-command-modal").modal("hide");
  }).catch((err) => {
    displayAddCommandAlert(err);
  });
});

function addInteraction() {
  $("#add-interaction-alert").empty();
  $('#add-interaction-form #interaction-name').val('');
  $('#add-interaction-form #interaction-handler').val('');
  $('#add-interaction-modal').modal('show');
};

function displayAddInteractionAlert({ title = "Error", message = "Couldn't create interaction." }) {
  $("#add-interaction-alert").empty();
  $("#add-interaction-alert").append(`
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <h4 class="alert-heading">${title}</h4>
      <p>${message}</p>
      <button class="close" type="button" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `.trim());
};

$("#add-interaction-form").submit(function (event) {
  event.preventDefault();
  // Parsing new intent
  let name = $('#add-interaction-form #interaction-name').val();
  let handler = $('#add-interaction-form #interaction-handler').val();

  let interaction = {
    name: name,
    interact: handler
  };

  // SUCCESS ! Let's add the intent to the code
  skill.addInteraction(interaction).then(() => {
    $("#add-interaction-modal").modal("hide");
  }).catch((err) => {
    displayAddInteractionAlert(err);
  });
});

function useSkillCommand() {
  $("#use-skill-alert").empty();
  $('#use-skill-form #use-skill-name').empty();
  $('#use-skill-form #use-skill-name').append($('<option>', {
    value: "",
    text: "Select the skill to use",
    selected: true,
    hidden: true
  }));
  for (let skillName in skills) {
    $('#use-skill-form #use-skill-name').append($('<option>', {
      value: skillName,
      text: skillName
    }));
  }
  $('#use-skill-modal').modal('show');
};

$('#use-skill-form #use-skill-name').change(() => {
  let selectedSkill = $('#use-skill-form #use-skill-name option:selected').val();
  $('#use-skill-form #use-skill-command').append($('<option>', {
    value: "",
    text: "Select the command to use",
    selected: true,
    hidden: true
  }));
  for (let commandName in skills[selectedSkill].commands) {
    $('#use-skill-form #use-skill-command').append($('<option>', {
      value: commandName,
      text: commandName
    }));
  }
  $('#use-skill-form #use-skill-command-group').show();
});

function displayUseSkillAlert({ title = "Error", message = "Couldn't use skill command." }) {
  $("#use-skill-alert").empty();
  $("#use-skill-alert").append(`
    <div class="alert alert-warning alert-dismissible fade show" role="alert">
      <h4 class="alert-heading">${title}</h4>
      <p>${message}</p>
      <button class="close" type="button" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `.trim());
};

$("#use-skill-form").submit(function (event) {
  event.preventDefault();
  // Parsing new intent
  let skillName = $('#use-skill-form #use-skill-name option:selected').val();
  let commandName = $('#use-skill-form #use-skill-command option:selected').val();

  let command = skills[skillName].commands[commandName];
  skill.addOverseer().then(() => {
    let useSkillString = `
overseer.handleCommand('${command.cmd}').then((response) => {
  /* Continue your code here */
  return resolve({
    success: true,
    message: {
      title: "Message title",
      text: "Skill response to display to user."
    }
  });
}).catch((error) => {
  /* Handle the error of this command here */
  return resolve({
    success: false,
    message: {
      title: "Error",
      text: "Couldn't execute the command."
    }
  });
});`.trim();
    $('#use-skill-string').text(useSkillString);
    $('#use-skill-string').show();
    $('#use-skill-help').show();
  }).catch((error) => {
    displayAddInteractionAlert(error);
  });
});

$("#save-skill").click(function () {
  skill.code = editor.getValue();

  if ($('#edited-skill-data').data('edit-skill')) {
    let notificationId = notifyUser({
      title: "Saving skill...",
      message: "We are pushing your skill, please wait.",
      type: "info",
      delay: -1
    });

    $.ajax({
      method: "PUT",
      baseUrl: base_url,
      url: "/skills/" + skill.name + "/code",
      data: { code: skill.code },
      dataType: "json",
      success: function (json) {
        console.log(json);
        dismissNotification(notificationId);
        if (json.success) {
          notifyUser({
            title: "Skill pushed!",
            message: `Your skill ${skill.name} is updated and running!`,
            type: "success",
            delay: 5
          });
        } else {
          notifyUser({
            title: `Can't push ${skill.name}`,
            message: json.message,
            type: "error",
            delay: 5
          });
        }
      },
      error: function (err) {
        dismissNotification(notificationId);
        notifyUser({
          title: "Error",
          message: `Couldn't push ${skilljson.name}.`,
          type: "error",
          delay: 5
        });
      }
    })
  } else {
    let skilljson = {
      skill_name: skill.name,
      skill_code: skill.code,
    }

    if (skill.secret) {
      skilljson.skill_secret = skill.secret;
    }

    let notificationId = notifyUser({
      title: "Saving skill...",
      message: "We are pushing your new skill, please wait.",
      type: "info",
      delay: -1
    });

    $.ajax({
      method: "PUT",
      baseUrl: base_url,
      url: "/skills",
      data: skilljson,
      dataType: "json",
      success: function (json) {
        console.log(json);
        dismissNotification(notificationId);
        if (json.success) {
          window.location.href = "/dashboard/skills/"+skill.name+"/edit?newSkill=true";
        } else {
          notifyUser({
            title: `Can't push ${skilljson.name}`,
            message: json.message,
            type: "error",
            delay: 5
          });
        }
      },
      error: function (err) {
        dismissNotification(notificationId);
        notifyUser({
          title: "Error",
          message: `Couldn't push ${skilljson.name}.`,
          type: "error",
          delay: 5
        });
      }
    });
  }
});


// Load code editor (hidden).
let editor = ace.edit('editor');
editor.session.setMode('ace/mode/javascript');
editor.setTheme('ace/theme/monokai');


// Init skill edit page
let skill;

// Load current bot skills
let skills = {};
$.ajax({
  method: "GET",
  baseUrl: base_url,
  url: "/skills",
  dataType: 'json',
  success: function (json) {
    if (json.success) {
      skills = json.skills;

      // Fill current skill data or init a new empty skill
      let editedSkillData = $('#edited-skill-data');
      if (editedSkillData.data('edit-skill')) {
        // Retrieve current skill data
        skill = new Skill();
        skill.name = editedSkillData.data('skill-name');
        skill.code = editedSkillData.data('skill-code');

        // Retrieve skill intents and commands
        for (let intentName in skills[skill.name].intents) {
          let intent = skills[skill.name].intents[intentName];
          intent.name = intentName;
          skill.intents[intentName] = intent;
        }

        for (let commandName in skills[skill.name].commands) {
          let command = skills[skill.name].commands[commandName];
          command.name = commandName;
          console.log(command);
          skill.commands[commandName] = command;
        }

        for (let interactionName in skills[skill.name].interactions) {
          let interaction = skills[skill.name].interactions[interactionName];
          interaction.name = interactionName;
          console.log(interaction);
          skill.interactions[interactionName] = interaction;
        }

        skill.dependencies = skills[skill.name].dependencies;

        $('#skill-generate').hide();
        $('#skill-toolbox').show();
        $("#left-panel").removeClass("col-md-4");
        $("#left-panel").addClass("col-md-2");
        $("#middle-panel").removeClass("col-md-6");
        $("#middle-panel").addClass("col-md-8");

        editor.setValue(skill.code);
        editor.clearSelection();
        showEditor();
        $('#loader').hide();
        $('#skill-editor').show();
      } else {
        // Init an empty skill
        skill = new Skill();
        $('#loader').hide();
        $('#skill-editor').show();

        // Welcome user on start.
        notifyUser({
          title: "Welcome!",
          message: "To begin building your new skill, you must generate it from a template (or build from scratch).",
          type: "info",
          delay: -1
        });
      }
    }
  },
  error: function (err) {

  }
});

//////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////
// TOOLBOX

/**
 * Onclick from button to see logs
 */
function loadLogs() {
  let editedSkillData = $('#edited-skill-data');
  let skillName = editedSkillData.data('skill-name');
  $.ajax({
    method: "GET",
    baseUrl: base_url,
    url: "/skills/" + skillName + "/logs",
    dataType: "json",
    success: function (json) {
      $("#logsForSkill").text(json.logs);
      $("#logsModal").modal("show");
    },
    error: function (err) {
      notifyUser({
        title: "Could not get logs",
        message: err.responseJSON.message || "Unknown error occured",
        type: "error",
        delay: 2
      })
    }
  })
}

function deleteLogs() {
  let editedSkillData = $('#edited-skill-data');
  let skillName = editedSkillData.data('skill-name');
  $.ajax({
    method: "DELETE",
    baseUrl: base_url,
    url: "/skills/" + skillName + "/logs",
    dataType: "json",
    success: function (json) {
      loadLogs();
    },
    error: function (err) {
      notifyUser({
        title: "Could not delete logs",
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

$.urlParam = function(name){
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
  if (results==null){
     return null;
  }
  else{
     return decodeURI(results[1]) || 0;
  }
}

if($.urlParam('newSkill')) {
  let editedSkillData = $('#edited-skill-data');
  let skillName = editedSkillData.data('skill-name');
  window.history.pushState("", "", "/dashboard/skills/"+skillName+"/edit");
  notifyUser({
    title: "Skill pushed!",
    message: `Your new skill ${skillName} is now running!`,
    type: "success",
    delay: 5
  });
}

//
//////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////
// HELP

/**
 * Update content of modal and display help according to the requested topic.
 * @param {String} topic 
 */
function displayHelp(topic) {
  if (!topic) {
    // Display generic help modal.
    $("#help-modal .modal-title").text("How to...");
    $("#help-modal .modal-body").html(
      '<div class="list-group list-group-flush">'
      + Object.entries(help).map(([topic, content]) => {
        return `
          <a class="list-group-item list-group-item-action action" onClick="displayHelp('${topic}')">
            <small>${content.title.replace('How to', "")}</small>
          </a>
        `.trim()
      }).join("\n")
      + '</div>');
    $("#help-modal").modal('show');
  }

  // get topic content
  const content = help[topic];
  if (!content) {
    console.warn("> Requested an unkown topic: " + topic);
    return;
  }
  $("#help-modal .modal-title").text(content.title);
  $("#help-modal .modal-body").html(
    '<a href="#" onClick="displayHelp()">Back to summary</a><hr>'
    + content.content
  );
  $("#help-modal").modal('show');
}

const help = {
  'commands': {
    title: 'How to add a new command to a skill?',
    content: `
      <p>To create a new command, you can use the helper button in the left pannel "Add Command".</p>
      <p>To manually add the command, first create a handler for the command:</p>
      <code style="white-space: pre-wrap;">
        function helloHandler({ phrase = "", data }) {
          return Promise.resolve().then(() => {
            /*
              Your code should go there. When you are ready to send the message, use the following return statement:
            */
            logger.log('helloSkill', "A user requested the hello command.");
            return {
              message: {
                title: 'Hello, world!',
                text: 'The hello command was successfull!'
              }
            };
          });
        }
      </code>
      <p>Don't forget the Promise or your skill will not work! Don't hesitate to return custom error messages instead of throwing errors.</p>
      <p>You then need to declare the command in the <code>commands</code> object of the skill:</p>
      <code style="white-space: pre-wrap;">
        let commands = {
          say-hello : {
            cmd: 'hello',
            execute: helloHandler,
            expected_args: []
          }
        };
      </code>
      <p>The <code>cmd</code> property is the word the user will type to call the command: <code>!hello</code>.</p>
    `.trim()
  },
  'intents': {
    title: 'How to add a new nlp intent to a skill?',
    content: `
      <p>Skill may be linked to natural language intents, you can use the helper button in the left pannel "Add Intent".</p>
      <p>To manually add the intent, first create a handler for the intent:</p>
      <code style="white-space: pre-wrap;">
        function weatherIntentHandler({ entities: { location: location = "" }, phrase = "", data }) {
          return Promise.resolve().then(() => {
            /*
              Your code should go there. You may return a message object, but usually, you will call a command handler
              that is the command-mode equivalent of the user's intent, usually by creating a "phrase" with the entities.
            */
            const phrase = location[0];
            logger.log('weatherSkill', "Calling the getWeatherHandler command for " + phrase);
            return getWeatherHandler({ phrase, data });
          });
        }
      </code>
      <p>Entities are arrays of values found in the initial user's phrase.</p>
      <p>You then need to declare the indent in the <code>intents</code> object of the skill:</p>
      <code style="white-space: pre-wrap;">
        let intents = {
          'get-weather': {
            slug: 'weather',
            handle: weatherIntentHandler,
            expected_entities: ['location']
          }
        };
      </code>
      <p>
        The <code>slug</code> property is the exact name of the intent recognized by your NLU processing service (forced to lowercase).
        <br>
        Your handler will not be called if some entities are missing, and will only receive the listed entities.
      </p>
    `.trim()
  },
  'threads': {
    title: 'How to create a conversation with the user?',
    content: `
      <p>To create a conversation flow, you can use the helper button in the left pannel "Add interaction".</p>
      <p>To manually add the conversation flow, first create a handler for the interaction:</p>
      <code style="white-space: pre-wrap;">
        function noYesHandler(thread, { phrase, data }) {
          return Promise.resolve().then(() => {
            /*
              The thread object, given by the brain, allow the skill to getData('key') and setData('key', value) in
              the thread, to keep track of context.
            */
            const question = thread.getData('question');
            if (['yes', 'no'].includes(phrase.toLowerCase())) {
              return {
                message: {
                  title: 'You answered: ' + phrase,
                  text: 'To the question: ' + question
                }
              }
            } else {
              return {
                message: {
                  title: 'Invalid answer',
                  text: 'It must be yes or no.'
                  interactive: true
                }
              }
            }
          });
        }
      </code>
      <p>To enter in interactive mode, simply add <code>interactive: true</code> in the returned message object. The brain will continue the current thread. To create a new one, add a <code>thread</code> object in addition to the <code>interactive: true</code>:</p>
      <code style="white-space: pre-wrap;">
        message: {
          interactive: true,
          thread: {
            source: question,
            data: [
              ['question': question]
            ],
            handler: "noYesHandler",
            duration: 30,
            timeout_message: "You took too much time to give your answer.",
          },
          title: 'What a question!',
          text: question
        }
      </code>
      <p>Finally, add the conversation handler to the <code>interactions<code> declaration of the skill:</p>
      <code style="white-space: pre-wrap;">
        let interactions = {
          'no-yes': {
            name: "no-yes",
            interact: noYesHandler
          }
        };
      </code>
    `.trim(),
  },
  'secrets': {
    title: 'How to store secret variables?',
    content: `
      <p>You should store secret variables, like api tokens and api credentials, in the secret object of a skill. The secret will not be displayed in skill's code.</p>
      <p>To edit the secrets of a skill, use the <strong>Configure Secret</strong> handler in the left pannel.</p>
    `.trim()
  },
  'skills': {
    title: "How to call another skill's command?",
    content: `
      <p>You may need to call another skill from within yours (like getting a one-use token for an external API that is used by several skills). You can use the <strong>Use another skill</strong> helper in the left pannel.</p>
      <p>To add the interaction manually, call the following code from within your function handler:</p>
      <code style="white-space: pre-wrap;">
        return overseer.handleCommand('get-ad-token').then(response => {
          // The response is the response given by the skill, containing the message and eventually additionnal data.
          // Do something with the token, which will eventually return a message object.
          return { message: {} };
        }).catch(err => {
          return {
            message: {
              title: 'Oups :(',
              text: 'Could not fulfill your request, sorry.'
            }
          }
        });
      </code>
      <p>Don't forget to catch the error! You should always return something to the user. Following the Promise chain pattern is good practise, but you may find more easy to <code>return new Promise((resolve, reject) => {})</code>.</p>
    `.trim()
  },
  'requests': {
    title: "How to call an external API?",
    content: `
      <p>You will certainly want to call an external service. You may use the <strong>axios</strong> (recommended for its Promise support) or the <strong>request</strong> package.</p>
      <p>Simply call axios methods from withing your command handler:</p>
      <code style="white-space: pre-wrap;">
        const token = require("./secret").token;
        const client = phrase;
        return axios({
          method: "GET",
          url: "https://brokkr.orochi.io/clients/$\{client\}/apps,
          data: { app_token: token },
          timeout: 5000
        }).then(res => {
          let text = "";
          res.data.content.forEach(app => {
             text += \`- *$\{app.name}*: _$\{app.status}_\n\`
          });
          return resolve({
              message: {
                  title: \`Applications on $\{phrase}\`,
                  private: true,
                  text
              }
          });
        }).catch(err => {
          return resolve({
            message: {
                title: 'Could not get applications list.',
                text: 'The Brokkr service is not accessible.'
            }
          });
        })
      </code>
      <p>Don't forget to catch errors, you should always return a message to the user.</p>
    `.trim()
  },
  'pipes': {
    title: 'How to I listen for external events?',
    content: `
      <p>You may need to wait for external API calls, like a github integration or another webhook. You can request a Pipe that will call your skill when to hook is received:</p>
      <code style="white-space: pre-wrap;">
        overseer.PipeManager.create("hello", "helloPipeHandler").then(pipe => {
          // Pipe created :)
          // Pipe is an object that contain its identifier.
          // The url will be https://thebrainurl/{skillName}/{identifier}
        });
      </code>
      <p>You need to create a handler for your pipe.</p>
      <code style="white-space: pre-wrap;">
        function pipeHandler(pipeIdentifier, { data, headers }) {
          /*
            Will be called by the brain when the url is called with a POST request,
            data will by the body, and headers will contain the request headers (if any).
          */
        })
      </code>
      <p>Declare your pipe in the <strong>pipes</strong> skill object.</p>
      <code style="white-space: pre-wrap;">
        let pipes = {
          'helloPipeHandler': {
              name: 'helloPipeHandler',
              transmit: pipeHandler
          }
        };
      </code>
      <p>If you need to send back a message to a user or a channel, you must use <strong>hooks</strong> (see the appropriate help section).</p>
    `.trim()
  },
  'hooks': {
    title: 'How to I send a message to a channel without being requested?',
    content: `
      <p>For security reasons, skills can't send messages to a channel without authorization. You need the request a hook to the brain and wait for the Adapter to confirm it.</p>
      <code style="white-space: pre-wrap;">
        overseer.HookManager.create("hello").then((hook) => {
          return resolve({
            message: {
                title: "Hook request",
                text: "I need a hook to call you :)",
                request_hook: true,
                hook: hook
            }
          });
        }
      </code>
      <p>Most adapters will validate immediatly the hook, but some may ask the user. Once your hook is valid, it will be executable with:</p>
      <code style="white-space: pre-wrap;">
        return overseer.HookManager.execute(hook.id, {
          message
        }, { deleteHook: false });
      </code>
      <p>
        The second argument being the skill's response with the message. Set deleteHook to true to delete the hook after execution.
        <br>
        If you need hooks that are persistent, you will need to store them. See the storage help section.
      </p>
    `.trim()
  },
  'storage': {
    title: 'How to store persistent data?',
    content: `
      <p>You may need to keep data event if the brain reload, like hooks id, alarms, or some other things. To do so, use the StorageManage from the brain:</p>
      <code style="white-space: pre-wrap;">
        const hooks = [];
        hookes.push(...);
        overseer.StorageManager.storeItem("hello", "hooks", hooks).then(() => {
          // Object stored!
        }).catch(err => overseer.log("hello", err));
      </code>
      <p>To retrieve data:</p>
      <code style="white-space: pre-wrap;">
        const hooks = [];
        hookes.push(...);
        overseer.StorageManager.getItem("hello", "hooks").then((hooks) => {
          // Object retrieved!
        }).catch(err => overseer.log("hello", err));
      </code>
    `.trim()
  }
}

//
//////////////////////////////////////////////////////////////////////////////////////