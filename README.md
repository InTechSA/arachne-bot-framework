# PoC : Bot Architecture
![BotBrain](/dashboard/public/imgs/logo.png)
> Proof of Concept of a Bot Architecture using microservices and skills.

[Install with NPM](#classical-installation)  
[Full Easy Install with Docker](#docker-full-install)  
[Install with Docker](#docker-install)

## IMPORTANT
### Known issues
> Installing with Node 10.x will crash due to bcrypt not having added node v10.x to its build configuration files yet.  
> Hubot-RocketChat v2.x.x will crash due to incompatibilities yet with hubot 3 (atm).

## Install
### Classical installation
- You must have a local installation of [NodeJS](https://nodejs.org) _(Tested for LTS 8 and v9.9.0)_ with npm.
- Clone this repository using `git clone https://github.com/Nakasar/bot-architecture-poc`.
- Move into the brain folder: `cd bot-architecture-poc/brain`.
- Install npm modules with `npm install`.
- Add the connect information to the database in `brain/database/secret.js`, exporting a valid `host` string for mongodb (atlas, or even local if you have mongodb running on your computer) **OR** set the mongodb connexion string as an environment variable `MONGO_URL` (see below).
- Run the brain with `npm start`, or with environment variables : `SET MONGO_URL="mongodb://localhost/botbrain" && SET PORT=8080 && node brain.js` _(Baware ! you must escape specific character, like `&`, in environment variables values !)_
- _Optional : run microservices at will using `npm install` and `npm start`._

> You can access the administration dashboard at [localhost:8080/dashboard](localhost:8080/dashboard). Setup admin user with [localhost:8080/dashboard/setup](localhost:8080/dashboard/setup), username is _Nakasar_ and password is _Password0_.

> Nota Bene: In order to use the nlp skill, you must add a `secret.js` file in the `brain/logic/skills/nlp` folder exporting a `recastai_token` with your recast ai token. (Or you may recode a new nlp skill exposing an `analyse` command). You also may set the `recastai_token` secret within the dashboard after running the brain.

> You can set the running port using `SET PORT=5012 && node brain.js` instead of `npm start`.

![Docker install](/docs_resources/docker.png)
### Docker full install
> Using the docker-compose file at the root of the project, you can run the brain, a mongo server, a rocketchat server and the adapter with a few commands, then start building skills.

- Clone this repository using `git clone https://github.com/Nakasar/bot-architecture-poc` then checkout a release branch (or keep master). Or download a release from github website.  
- Edit or create a .env file at the root of the project: `cd bot-architecture-poc` then `nano .env`. Let the BOT_TOKEN empty as you can't create one yet.  

```
###
# ADAPTER
###
BOT_URL=http://brain:8080
BOT_TOKEN=
HUBOT_NAME=superbot
ROCKETCHAT_USER=superbot
ROCKETCHAT_PASSWORD=password

###
# BRAIN
###
# Url of the brain.
MONGO_URL=mongodb://mongo:27017/brain
BRAIN_HOST=0.0.0.0
BRAIN_PORT=8080
```

- Run the containers with `docker-compose up -d`.
- The bot adapter should crash in loop. You have to connect to [http://localhost:3000](http://localhost:3000) and create a user named `superbot` with password `password`.
- Setup the dashboard admin account at [http://localhost:3012/dashboard/setup](http://localhost:3012/dashboard/setup)
- Login to the dashboard as admin: [http://localhost:3012/dashboard/login](http://localhost:3012/dashboard/login). Username is `Nakasar` and password is `Password0`.
- Go to the connectors pannel [http://localhost:3012/dashboard/connectors](http://localhost:3012/dashboard/connectors) and create a new connector. Copy its token.
- Edit the BOT_TOKEN variable in the .env file with the token you just copied.
- Stop all containers with `docker-compose stop` and run them again with `docker-compose up -d --build`.
- Here you are! You can create other account on rocketchat and have fun with the bot!

> Note Bene: To use the natural language, you must edit the skill named _nlp_ and add a secret with key `recastai_token` and the recast.ai token as value, or create a new skill with a command named "analyzed".

### Docker install
- Clone this repository using `git clone https://github.com/Nakasar/bot-architecture-poc`.
- Configure the `MONGO_URL` variable in the docker file with the appropriate connection string to your provider (eventually local mongodb) or set it when running container.
- Build the Brain image using the Dockerfile, then run it : _(in brain/)_ `docker build . -t nakasar/botbrain` then `docker run -d -p 49160:8080 nakasar/botbrain` _(don't forget to expose port 49160 to access dashboard and brain API!)_. You can set environment variables with the extended command instead: `docker run -d -e MONGO_URL='mongodb://localhost/botbrain' -p 49160:8080 nakasar/botbrain`.
- Run rocketchat server and rocket chat adapter with docker-compose (in `connectors` folder, run `docker-compose up -d`).

> You can access the administration dashboard at [127.0.0.1:49160/dashboard](127.0.0.1:49160/dashboard). Setup admin user with [127.0.0.1:49160/dashboard/setup](localhost:8080/dashboard/setup), username is _Nakasar_ and password is _Password0_.

> Note Bene: If you run docker inside a Virtual Machine, be sure to expose the following ports in your VM software : 3012 <-> 49160 (adapter), 3000 <-> 3000 (rocketchat server). Dashboard will be accessible from [127.0.0.1:3012/dashboard](127.0.0.1:3012/dashboard).

> Nota Bene: In order to use the nlp skill, you must add a `secret.js` file in the `brain/logic/skills/nlp` folder exporting a `recastai_token` with your recast ai token. (Or you may recode a new nlp skill exposing an `analyze` command). You also may set the `recastai_token` secret within the dashboard after running the brain.

> Nota Bene: If you are using the rocketchat server included, you must create a user named `superbot`, a random email, and password `password` for the bot. Then log out and create another account for you.

## Architecture
![Diagram of Architecture](/docs_resources/PoC%20Bot%20Architecture%20Diagram.png)

### Bot Connectors
Connectors are basically just pipelines to transfer messages from the chat itself to the bot's brain. All they do is basically handling their own permissions (and self-commands like `join`) and differencing direct commands from natural language requests. Token must authenticate themselves through a valid token generated on the dashboard (in request header `x-access-token` or in body `token`).  
Adapter can pass data to the brain using the `data: {}` object in body. Data will be passed to skill handlers. It is good practise to send an unique channel identifier and the name of the user that entered the command.

#### Sockets / HTTP API
You may implement a connector that use the HTTP API of the brain or use websockets (socket-io). Socket events emitted by the adapter are: 

| event         | HTTP equivalent | params                          | callback    | description                                 |
| ------------- | --------------- | ------------------------------- | ----------- | ------------------------------------------- |
| `nlp`         | `/nlp`          | { phrase, data: {} }            | (err, body) | Send a phrase to be analyzed by the brain.  |
| `command`     | `/command`      | { command, data: {} }           | (err, body) | Send a command to be executed by the brain. |
| `converse`    | `/converse`     | { thread_id, phrase, data: {} } | (err, body) | Send a phrase to be analyzed to the brain.  |
| `hook-accept` | `/hooks`        | hook_id                         | (error)     | Accept the creation of a hook.              |

Socket events received by the adapter are:

| event  | callback        | description                                                           |
| ------ | --------------- | --------------------------------------------------------------------- |
| `hook` | (hook_id, body) | Hook triggered by the brain, body will contain the message to display |

#### Example
Here is an example of a simple adapter using [Hubot](https://hubot.github.com/) for [RocketChat](https://rocket.chat/) and HTTP API. It will not handle threads and hooks.

> See the full implementation in the [connectors folder](/connectors/rocketchat-hubot/scripts). It uses a socket-io link with the brain.

```javascript
const request = require('request');
const api_host = process.env.API_HOST || "localhost";
const api_port = process.env.API_PORT || "8080";
const api_url = `http://${api_host}:${api_port}`;
const bot_token = process.env.BOT_TOKEN || "";

function parser(room, message) {
  let formatted = {
    channel: room,
    attachments: []
  };
  if (message.text) {
    let attachment = {
      text: message.text
    };
    if (message.title) {
      attachment.title = message.title;
    }
    formatted.attachments.push(attachment);
  }
  if (message.avatar) {
    formatted.avatar = message.avatar;
  }
  if (message.emoji) {
    formatted.emoji = message.emoji;
  }
  if (message.attachments) {
    for (let attachment of message.attachments) {
      let formattedAttachment = {};
      if (attachment.color) {
        formattedAttachment.color = attachment.color;
      }
      if (attachment.thumbnail) {
        formattedAttachment.thumb_url = attachment.color;
      }
      if (attachment.text) {
        formattedAttachment.text = attachment.text;
      }
      if (attachment.collapsed) {
        formattedAttachment.collapsed = attachment.collapsed;
      }
      if (attachment.author_name) {
        formattedAttachment.author_name = attachment.author_name;
      }
      if (attachment.author_link) {
        formattedAttachment.author_link = attachment.author_link;
      }
      if (attachment.author_icon) {
        formattedAttachment.author_icon = attachment.author_icon;
      }
      if (attachment.title) {
        formattedAttachment.title = attachment.title;
      }
      if (attachment.title_link) {
        formattedAttachment.title_link = attachment.title_link;
      }
      if (attachment.image_url) {
        formattedAttachment.image_url = attachment.image_url;
      }
      if (attachment.audio_url) {
        formattedAttachment.audio_url = attachment.audio_url;
      }
      if (attachment.video_url) {
        formattedAttachment.video_url = attachment.video_url;
      }
      // TODO: Parse fields
      formatted.attachments.push(formattedAttachment);
    }
  }
  console.log(formatted);
  return formatted;
};

module.exports = function(robot) {
  robot.hear(/!(.*)/, function(message) {
    let command = message.match[1];
    request({
      baseUrl: api_url,
      uri: "/command",
      method: "POST",
      json: true,
      body: {
        command: command,
        token: bot_token
      },
      callback: (err, res, body) => {
        if (!err && body.message) {
          robot.messageRoom(
            message.message.room,
            parser(message.message.room, body.message)
          );
        } else {
          message.send("An error occured :'(");
        }
      }
    });
  });

  robot.respond(/(.*)/, function(message) {
    let phrase = message.match[1];

    if (phrase.startsWith("!")) {
      return;
    }

    console.log("Catched: " + phrase);
    request({
      baseUrl: api_url,
      uri: "/nlp",
      method: "POST",
      json: true,
      body: {
        phrase: phrase,
        token: bot_token
      },
      callback: (err, res, body) => {
        if (!err && body.message) {
          robot.messageRoom(
            message.message.room,
            parser(message.message.room, body.message)
          );
          } else {
          message.reply("An error occured :'(");
        }
      }
    });
    message.reply();
  });
};
```

### Skill Services
Skill Services are external microservices that may (or may not) by accessible by other application. One may return weather forecast, another may give informations about collaborators.

### Skills
Skills are small scripts executed by the brain node server. They expose their commands and intents. Skills are automatically loaded by the bot on startup, and may be added at runtime, or removed/disabled.

### Threads and conversation mode
Skills can notify the hub that their response is awaiting one from the user (like a confirmation, or a selection). For that, they need to create a _Thread_ stored by the hub, via the overseer they can require. This will create a unique thread id that the skill must return to the adapter. The adapter will then activate the "conversation mode" for the next reply, and send it to the `/converse` endpoint with the thread id they received. The hub will call the skill handler defined for this thread at his creation.

![The Conversation Mode Diagram](/docs_resources/quizz_workflow.png)

### Hooks
Skills can anchor hooks with adapters that implements them. They can register a new Hook with the _HookManager_ accessible via the _overseer_: `overseer.HookManager.create("skill_name")`. This will return a Promise to the created hook. The hook will no be valid, and the adapter must confirm before it can be executed. To request a hook, the `message` object returned by the skill must contain `request_hook: true` and `hook_id: <hook_id>`. Adapters should understand the request when parsing the message, and will validate the hook. Then, the skill will be able to execute the hook with `overseer.HookManager.execute(hook_id, message)` (which is a Promise).

> Nota Bene: It is the responsability of the skill to handle Promise rejections with personnalized error messages.

When executing a hook, in case of an error, you will recieve an error code that you can use to update your skill's storage. For instance, if you catch `overseer.HookManager.codes.NO_HOOK`, it means the Hook was deleted by the hub, or `NO_CONNECTOR_LINKED` if no connector accepted the hook, or `NO_CONNECTOR_ONLINE` if the linked connector could not be reached.

#### example
```javascript
overseer.HookManager.create("skill_name").then((hook) => {
  let alarm = new Date(new Date() + 5*60000); // Set a alarm in 5 minutes.
  schedule(alarm, () => {
    overseer.HookManager.execute(hook._id, {
      message: {
        title: "Ring!",
        text: "That's an alarm, folks!"
      }
    }).catch(); // You may want to update your skill storage in case of a rejection (eg. removing the hook from your storage.)
  });
}).catch((err) => {
  return resolve({
    message: {
      title: "Oups :(",
      text: "I can't do that, I'm sorry!"
    }
  });
});
```

### Requesting other skill commands
Skills can execute other skill's commands via the overseer they can require (some skill may restrict what skills can access their commands via an auth system):
```javascript
const overseer = require('../../overseer');

  /*
   * In handler :
   */
  overseer.handleCommand('get-ldap-token').then((response) => {
    let token = response.token;
    // ...
  }).catch((error) => {
    // Error handling
  });
```

> Don't forget to catch the error, in case the command cas deactivated!

Anything outside the `message` object returned by a skill will never be returned to any adapter, but might be accessible to other skill using the overseer command handling.

#### Message formatting
Adapters reformat messages to send rich embeded message (if any) to clients. The brain must send compatible message format.

The simpliest message a skill may return from one of its Promise is the following :
```javascript
resolve({ message: { text: "This is a very simple message." } });
```

You may add some additionnal information to the message object, like a title, or change the message avatar (using the image url instead of bot avatar, or the give emoji, not supported by all adapter!) :
```javascript
resolve({
  message: {
    title: "Hey!",
    avatar: "https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png",
    emoji: ":smirk:",
    text: "This message has an amazing title!"
  }
});
```

**Attachments**
Messages can display several attachments, these are additionnals fields displayed after the message. They can contain images, video, files, buttons, text...

![https://a.slack-edge.com/1877/img/api/message_guidelines/Formatting_1.png](https://a.slack-edge.com/1877/img/api/message_guidelines/Formatting_1.png)

Attachments are listed under the `attachments` array of the message object :
```javascript
resolve({
  message: {
    title: "An incredible message",
    text: "This message is surely the best!",
    attachments: [
      {
        color: "#ff0000",
        text: "This text will have a red border and an alert icon. Cool!",
        thumbnail: "http://www.gohrt.com/images/icons/alert-icon-red.png"
      },
      {
        color: "#00ff00",
        title: "What a video!",
        title_link: "https://www.youtube.com",
        collapsed: true,
        video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        author_name: "Some artist",
        author_link: "http://wikipedia.com"
        author_icon: "https://assets-cdn.github.com/images/modules/logos_page/GitHub-Mark.png"
      },
      {
        title: "What an image!",
        image_url: "https://pre00.deviantart.net/e95b/th/pre/i/2011/267/e/2/french_montain_by_bancomphotos-d4ardpn.jpg"
      },
      {
        color: "#000000",
        title: "Some table",
        text: "Here are a lot of fields!",
        fields: [
          {
            title: "Fun fact 1",
            message: "I lied, it's not a fact."
          },
          {
            title: "Fun fact 2",
            message: "I lied, again."
          }
        ]
      }
      ...
    ]
  }
});
```


#### Skill Example
Here is an example of skill fetching weather on a personnal weather API service:

```javascript
/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  weather : {
    cmd: 'weather',
    execute: getWeather,
    expected_args: ['location']
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'weather-weather': {
    slug: 'weather',
    handle: handleWeather,
    expected_entities: ['location']
  }
};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ['request'];
/* </SKILL DEPENDENCIES> */

// Exposing the skill definition.
exports.commands = commands;
exports.intents = intents;
exports.dependencies = dependencies;
exports.interactions = interactions;

/*
  Skill logic begins here.
  You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
*/
/* <SKILL LOGIC> */
const request = require('request');

const serviceURL = "http://localhost:5012";

function getWeather({ phrase }) {
  return new Promise((resolve, reject) => {
    let location = phrase;
    if (location.length <= 0) {
      return resolve({
        message :{
          text: `I need a location (like \`Kayl, lu\`).`
        }
      });
    }

    console.log(`> [INFO] {weather} - Get weather for "${location}".`);
    request({
      baseUrl: serviceURL,
      uri: '/weather',
      qs: {
        location: location
      },
      json: true,
      callback: (err, res, body) => {
        if (!err && body && body.success) {
          let weatherMessage = `Here's the weather for *${body.weather.name}*:`
          weatherMessage += `\nSky: ${body.weather.weather[0].main}`;
          resolve({
            message :{
              text: weatherMessage
            }
          });
        } else {
          resolve({
            message: {
              text: "I couldn't load weather for this location :/"
            }
          });
        }
      }
    });
  });
};

function handleWeather({ entities: {location: location = ""} }) {
  let finalLocation = location[0];
  return getWeather({ phrase: finalLocation });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.
```

And here is an example with conversation mode enabled:
```javascript
/*
  SKILL : quizz
  AUTHOR : Anonymous
  DATE : 05/04/2018
*/

/*
  You should not modify this part unless you know what you're doing.
*/

// Defining the skill
// Commands the skill can execute.
/* <SKILL COMMANDS> */
let commands = {
  'quizz': {
    cmd: "quizz",
    execute: quizz
  }
};
/* </SKILL COMMANDS> */

// intents the skill understands.
/* <SKILL INTENTS> */
let intents = {
  'quizz-quizz': {
    slug: "quizz",
    handle: handleQuizz,
    expected_entities: []
  }
};
/* </SKILL INTENTS> */

// Conversation handlers of the skill.
/* <SKILL INTERACTIONS> */
let interactions = {
  'thread-quizz-handler': {
    name: "thread-quizz-handler",
    interact: answerHandler
  }
};
/* </SKILL INTERACTIONS> */

// dependencies of the skill.
/* <SKILL DEPENDENCIES> */
let dependencies = ["request"];
/* </SKILL DEPENDENCIES> */

// Exposing the skill definition.
exports.commands = commands;
exports.intents = intents;
exports.dependencies = dependencies;
exports.interactions = interactions;

/*
  Skill logic begins here.
  You must implements the functions listed as "execute" and "handle" handler, or your skill will not load.
*/
/* <SKILL LOGIC> */
const overseer = require('../../overseer');
const request = require('request');

/**
  Handler for command quizz (!quizz).

  Params :
  --------
    phrase: String
*/
function quizz({ phrase }) {
  return new Promise((resolve, reject) => {
    request.get({
        url: "https://opentdb.com/api.php?amount=1&difficulty=medium&type=multiple",
        json: "true",
        callback: (err, res, body) => {
            if (!err && body) {
                overseer.ThreadManager.addThread({
                  timestamp: new Date(),
                  source: body.results[0].question,
                  data: [
                    ["correct_answer", body.results[0].correct_answer],
                    ["incorrect_answers", body.results[0].incorrect_answers]
                  ],
                  handler: "thread-quizz-handler"
                }).then((thread) => {
                  let question = "Quizz:\n*" + body.results[0].question + "*";

                  let answers = body.results[0].incorrect_answers;
                  answers.push(body.results[0].correct_answer);
                  answers.sort();

                  question += "\n> " + answers.join("\n> ");
                  question += "\n (type `abort` or `skip` to skip)";

                  return resolve({
                      message: {
                          interactive: true,
                          thread_id: thread._id,
                          title: body.results[0].category,
                          text: question
                      }
                  });
                }).catch((e) => {
                  return resolve({
                      message: {
                          title: "Cannot send question.",
                          text: "Error while creating thread."
                      }
                  });
                });
            } else {
                return resolve({
                    message: {
                        title: "Cannot fetch quizz",
                        text: "Error while requesting quizz service."
                    }
                });
            }
        }
    });
  });
}

function answerHandler(thread, { phrase }) {
  return new Promise((resolve, reject) => {
    if (phrase === thread.getData("correct_answer")) {
      overseer.ThreadManager.closeThread(thread._id).then(() => {
        return resolve({
            message: {
                title: "Correct o/",
                text: `${phrase} is the correct answer, congrats!`
            }
        });
      }).catch((e) => {
        return resolve({
            message: {
                title: "Correct o/",
                text: `${phrase} is the correct answer, congrats!`
            }
        });
      });
    } else if(["abort", "skip"].includes(phrase)) {
      overseer.ThreadManager.closeThread(thread._id).then(() => {
        return resolve({
            message: {
                title: "Aborting",
                text: `The answer was *${thread.getData("correct_answer")}* `
            }
        });
      }).catch((e) => {
        return resolve({
            message: {
              title: "Aborting",
              text: `The answer was *${thread.getData("correct_answer")}* `
            }
        });
      });
    } else {
      return resolve({
          message: {
              interactive: true,
              thread_id: thread._id,
              title: "Wrong :(",
              text: `${phrase} is not the expected answer, try again!`
          }
      });
    }
  });
}
/**
  Handler for intent quizz-quizz (quizz).

  Params :
  --------
    entities (Object)
*/
function handleQuizz({ entities: {}, phrase, data }) {
  return quizz({ phrase });
}
/* </SKILL LOGIC> */

// You may define other logic function unexposed here. Try to keep the skill code slim.
```
