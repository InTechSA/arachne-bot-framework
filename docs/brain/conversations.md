# Threads and Conversations

Skills can notify the hub that their response is awaiting one from the user (like a confirmation, or a selection). For that, they need to create a _Thread_ stored by the hub, via the overseer they can require. This will create a unique thread id that the skill must return to the adapter. The adapter will then activate the "conversation mode" for the next reply, and send it to the `/converse` endpoint with the thread id they received. The hub will call the skill handler defined for this thread at his creation.

![The Conversation Mode Diagram](/src/imgs/quizz_workflow.png)

## Create a conversation in a skill

To create a conversation within a skill, you need to first add a interaction object by clicking on the "add interaction" button on the left, or by adding the following code in the top of the skill : 

```javascript
// In the Conversation handler part of the skill
let interactions = {
    // The name of the conversation given ( can be anything )
    'thread-test': {
        // This one need to be the same as declared below
        name: "thread-test",
        // This one is the name of the function for when entering the conversation mode, ie when the API receive a message on the route /converse with the thread id associated to this skill 
        interact: testThreadHandler
  }
};
```

Then in the skill code ( specificly in the function of the command or the nlp ) return a specific message in the skill like the following one : 

```javascript
...
// Code in the skill logic
return resolve({
    // return the message with the thread parameters to create a thread
    message: {
        // interactive true, required to create a thread or continue a thread
        interactive: true,
        // thread parameter, required to create a thread
        thread: {
            // The source phrase that created the thread, ( optional )
            source: phrase,
            // Eventual data to add to the thread, ( optional )
            data: [data_un: 42, data_deux: "data_deux"],
            // the handler, REQUIRED, ie the name in the interaction object above 
            handler: "thread-test",
            // duration of thread before timeout ( optional, default set to 30 )
            duration: 10,
            // The time out message ( optional )
            timeout_message: "Cette conversation a timeout, dommage !!"
        },
        title: "Not implemented",
        text: "J'ai crée le thread"
    }
});
```

From this point, the skill will be created, you then need to add a function in the skill logic to response to the conversation request that will be following :

```javascript
// The function called when entered a conversation ( ie when someone send a request on the /converse route with a thread id for this skill )
function testThreadHandler(thread, {phrase, data}) {
    return new Promise((resolve, reject) => {
        if(phrase == 'coucou') {
            // If you want to close a thread, just don't put the interactive true parameter
            return resolve({
                message: {
                    title: "Aborting",
                    text: `Fermeture du thread`
                }
            });
        } else {
            // Else , precise the interactive true parameter
            return resolve({
                message: {
                    interactive: true,
                    title: "Continue",
                    text: `Je continue`
                }
            });
        }
    });
}
```