# Threads and Conversations

Skills can notify the hub that their response is awaiting one from the user (like a confirmation, or a selection). For that, they need to create a _Thread_ stored by the hub, via the overseer they can require. This will create a unique thread id that the skill must return to the adapter. The adapter will then activate the "conversation mode" for the next reply, and send it to the `/converse` endpoint with the thread id they received. The hub will call the skill handler defined for this thread at his creation.

![The Conversation Mode Diagram](/src/imgs/quizz_workflow.png)

## Create a conversation in a skill

To handle a conversation for your skill, you first need to declare a new interaction with the `skill.addInteraction(name, handler)`. The name, once again, has to be unique accross all skills. The handler is a `Function(thread, { phrase, data })` that returns a Promise to a _response_ object:

```javascript
module.exports = (skill) => {
    skill.addInteraction("lang-selection", (thread, { phrase, data }) => {
        return Promise.resolve().then(() => {
            const knowLanguages = ["french", "japanese", "english"];

            if (phrase === "quit") {
                return {
                    message: {
                        text: "Alright!"
                    }
                }
            } else if (phrase && knowLanguages.includes(phrase)) {
                // Here, we will call our hello command while populating the arguments of the command with the language.
                return skill.handleCommand("hello", { phrase: phrase, data });
            } else {
                // Return a message that will continue this conversation by passing the given thread object.
                return {
                    message: {
                        text: `I don't know this language, sorry. I can only talk in: ${knowLanguages.join(", ")}. Please select another one or quit.`,
                        interactive: true,
                        thread: thread
                    }
                }
            }
        }).catch(err => {
            return {
                message: {
                    text: "Something went wrong, I'm sorry."
                }
            };
        });
    });
}
```

To create a new conversation using the created handler, populate the _message_ object with `interactive: true` and a `thread` _object_.

The `thread` _object_ expect the phrase that solicitate the conversation in _source_. You can store data in this thread as [[key, value]] array. You can set a duration and a timeout_message to display if the thread timeout. Finally, you must specify the name of the handler.

```javascript
...
// Code in the skill logic
return {
    // return the message with the thread parameters to create a thread
    message: {
        // interactive true, required to create a thread or continue a thread
        interactive: true,
        // thread parameter, required to create a thread
        thread: {
            // The source phrase that created the thread, ( optional )
            source: phrase,
            // Eventual data to add to the thread, ( optional )
            data: [[data_un, 42], [data_deux, "data_deux"],
            // the handler, REQUIRED, ie the name in the interaction object above 
            handler: "lang-selection",
            // duration of thread before timeout ( optional, default set to 30 )
            duration: 10,
            // The time out message ( optional )
            timeout_message: "Contact me again if you need something."
        },
        title: "Select a language",
        text: "In what language should I say hello in?"
    }
};
```
