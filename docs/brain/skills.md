# Skills

Skills are small scripts executed by the brain node server. They expose their commands and intents. Skills are automatically loaded by the bot on startup, and may be added at runtime, or removed/disabled.

Skills are edited from with the dashboard (or using the arachne API). You can edit their code or their secret variables (like token for external services).

Skill code and secrets are stored locally in the `/logic/skills` folder only for runtime purposes. Skills are persisted in the brain database, and will load these distants skills at startup. **Therefore editing local files WILL NOT persist modifications ! You MUST use the dashboard or the brain API.**

See the [api documentation](/brain/api.md#skills) for the complete list of endpoints available to manage skills.

## Definition of a Skill
A skill is a file that exports a function taking as parameter a Skill object:

```javascript
/*
  SKILL: HELLO
  AUTHOR: NAKASAR
  DATE: 
*/

module.exports = (skill) => {
  skill.setDescription("This is my Skill");
}
```

### Expose a new command
To add a new command, call the `skill.addCommand(cmd, name, handler, help)` method. The `cmd` parameter is the command word typed by the user to call the command, the `handler` is a Function({ phrase, data }) that will be called by the brain. You must also define a `help` object with at least a description (some examples would be welcomed).

The `cmd` word is unique accross all the brain, and your skill will not load if another skill already use this command word. First in, first out.

The handler is a **Promise** that resolves to a _response_ object containing a `message: { title, text, attachments... }`. The brain will return to the sender of the command this _message_ object. If you need to send additionnal data in case another skill executed the command, set it in the _response_ object, not in the _message_ object.

The help object is used by the brain to generate help for skills, so that any user can easily now what the brain can do. The manual is available at this url: [http://brainurl/manual](http://brainurl/manual), or, for thoe who miss the man page, at [http://brainurl/help/man](http://brainurl/help/man).

Your handler will get a `phrase` _string_ which is what the user typed (without the `cmd` word), and a `data` _object_ that contains additionnal data, such as the username, the channel identifier, the adapter identifier...

```javascript
/*
  SKILL: HELLO
  AUTHOR: NAKASAR
  DATE: 
*/

module.exports = (skill) => {
  skill.setDescription("Can say hello!");

  skill.addCommand("hello", "say-hello", ({ phrase, data }) => {
    // The handler must be a promise that resolves to a response.
    // The response contains a message object that can be complex, or as simple as some text.
    return Promise.resolve().then(() => {
      let text;
      if (phrase.length > 0) {
        // We have a user to greet.
        text = "Welcome " + phrase;
      } else {
        text = "Welcome my friend!"
      }

      return {
        message: {
          title: "Hello!",
          text: text
        }
      };
    }).catch(err => {
      // You should always return something to the user.
      // If you don't, the brain will send a generic error message.
      // So you'd better catch any final errors here.
      return {
        message: {
          text: "I couldn't say hello, I'm sorry."
        }
      };
    });
  }, {
    description: "Say hello.",
    parameters: [
      {
        position: 0,
        name: "user",
        description: "Name of the user to greet (optional)",
        example: "Nakasar"
      }
    ]
    examples: [
      {
        phrase: "!hello",
        action: "Displays a greeting."
      },
      {
        phrase: "!hello Nakasar",
        action: "Displays a personnal greeting."
      }
    ]
  })
}
```

### Add a new intent.
You can define intents that will be called when users talk to the bot with natural language. Intents are returned from a Natural Language Understanding service such as Wit.ai, DialogFlow, Recast.ai, or anything else that returns intents and entities from a sentence.

Whenever the brain receives a sentence, it will execute a command called `analyze`, so you better create a skill that exposes such a command. This command must return a _response_ object of this format:

```javascript
return {
  message: {
    text: `Sentence analyzed. ${intentslug ? `Intent found: ${intentslug}`: "No intent found."}`
  },
  intent: intentslug,
  entities: {
    'lang': [
      'french'
    ]
  }
}
```

The brain will then look for a skill that has a handler for the `intentslug` found, and call this handler.

To declare an intent for your skill, use the `skill.addIntent(slug, name, handler)` method.

The `slug` is unique accross all the brain, and your skill will not load if another skill already use this intent slug. First in, first out.

The handler is a **Promise** that resolves to a _response_ object containing a `message: { title, text, attachments... }`. The brain will return to the sender of the intent this _message_ object.

Your handler will get a `phrase` _string_ which is what the user typed (without the `cmd` word), and a `data` _object_ that contains additionnal data, such as the username, the channel identifier, the adapter identifier...


```javascript
/*
  SKILL: HELLO
  AUTHOR: NAKASAR
  DATE: 
*/

module.exports = (skill) => {
  // skill.addCommand(hello...);
  
  skill.addIntent("say-hello", "say-hello", ({ entities, data }) => {
    // The handler must be a Promise that resolves to a response.
    // The response contains a message object that can be complex, or as simple as some text.
    return Promise.resolve().then(() => {
      if (!entities.lang) {
        return {
          message: {
            text: "You didn't tell me in what language I should say hello!"
          }
        }
      }
      let text;
      switch(entities.lang[0]) {
        case "french":
          text = `Bonjour ${data.username || "mon ami !"}`;
          return text;
        case "english":
          text = `Hello ${data.username || "folk!"}`;
          return text;
        case "japanese":
          text = `こんにちはケビン!`;
          return text;
        default:
          text = `I'm afraid I don't speak this langage, sorry.`;
          return text;
      }
    }).then(greeting => {
      // The handler is a Promise, so don't hesitate to use the Promise chaining mecanism.
      return {
        message: {
          text: greeting
        }
      }
    }).catch(err => {
      // You should always return something to the user.
      // If you don't, the brain will send a generic error message.
      // So you'd better catch any final errors here.
      return {
        message: {
          text: "I couldn't say hello, I'm sorry."
        }
      };
    });
  });
}
```

## Using brain components

### Use skill commands from within another skill
Skills can execute other skill's commands (some skill may restrict what skills can access their commands through an auth system):

```javascript
module.exports = (skill) => {
  /*
    Here goes the definition of the skill.
  */

  skill.addCommand("hello", "say-hello", ({ phrase, data }) => {
    return skill.execute("helloworld", ({ phrase, data })); // Will call the helloworld command from another skill.
  }, { description: "Will say hello." });
}
```

> Don't forget to catch the error, in case the command was deactivated!

Anything outside the `message` object returned by a skill will never be sent to any adapter, but might be accessible to other skill using the execute method.

### Store a secret variable.
You may want to define secret variables, such as an API token or credentials to a service. You don't want to store these in the skill file, as it may be visible by other users that have the permission to access this skill.

The Skill object allow you to retrieve a secret for a skill that you can set with the API or the dashboard:

```javascript
module.exports = (skill) => {
  const secret = skill.getSecret();
  skill.log("My secret token is " + secret.token);
}
```

### Log something
Each skill store their own logs so that you can easily understand what goes wrong and when, without being able to access the logs of skill you should'nt see.

```javascript
module.exports = (skill) => {
  skill.log("Skill is up and loaded!");
  skill.log({ message: "I can log objects too!" });
}
```

### Do so much more?
The next sections explain how to handle conversations and how to create hooks with an adapter. But before, we will learn to create rich messages.