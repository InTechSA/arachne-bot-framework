# Example of Adapter

Here is an example of a simple adapter using [Hubot](https://hubot.github.com/) for [RocketChat](https://rocket.chat/) and Web Socket.

> See the full implementation in the [Adapter project](https://gitlab.intech.lu/arachne-bot/Adapter-RocketChat/tree/master/scripts) of GitLab. It uses a socket-io link with the brain.

## Thread Handler

To handle thread, the adapters check every message received by the brain and check if there is an `interactive: true` parameter in the return message.

```javascript
handleThread(thread, room, interactive) {
    if (interactive) {
        console.log("Interactive true, continue or create THread");
        return this.createThread(thread, room);
    }
```

```javascript
// From a message received by the adapter from the brain
thread.handleThread(body.message.thread, message.message.user.roomID, body.message.interactive)
```

If that's the case, it will store the thread with the thread id given, the duration before timeout and the variable associated to the timeout. The key of the object is the room ID.

```javascript
createThread(thread, room) {
    // Check if there is a thread associated to the room
    if (!this.storeThreads.has(room)) {
        console.log("Create thread in room " + room);
        // Create the thread and the timeout associated to it
        var timeoutvar = setTimeout(() => this.closeThreadOnTimeout(room), thread.duration * 1000);
        console.log("Set timeout to " + thread.duration + " seconds");
        // Set it in the map
        this.storeThreads.set(room, { id: thread.id, duration: thread.duration, timeoutvar });
    } 
```

Then, when the adapter received the next message, if the message is in the room associated to the thread, it will retreived the thread id and sent the message directly to the /converse path of the brain with the thread id as parameter.

```javascript
thread.checkThread(message.message.user.roomID)
```

```javascript
var checkThread = (room) => {
    var thread_id = null;
    console.log(storeThreads);
    if (storeThreads.has(room)) {
        thread_id = storeThreads.get(room);
    }
    return new Promise((resolve, reject) => {
        console.log("Thread id " + thread_id);
        return resolve(thread_id);
    });
}
```

```javascript
if (thread_id) {
  if (phrase === '') {
      return message.send("> Entrez votre message après la commande");
  }
  if (!socket.connected) {
      socket.open();
      return message.send("> Impossible de joindre le cerveau.\n_(Si le problème persiste, contactez un administrateur.)_")
  }
  socket.emit('converse', { thread_id, phrase, data: { channel: message.message.room, userName: message.message.user.name, privateChannel: message.envelope.user.roomType==='d' } }
```

As long as the brain send an interactive parameter, the adapter will keep the thread and refresh the timeout :

```javascript
handleThread(thread, room, interactive) {
    if (interactive) {
        console.log("Interactive true, continue or create THread");
        return this.createThread(thread, room);
    }
    else {
        console.log("Interactive false");
        return this.closeThread(room);
    }
}
// From create Thread if interactive = true and thread already exist
else {
    // Existing thread
    var thread = this.storeThreads.get(room);
    // Refresh the timer of the thread
    clearTimeout(thread.timeoutvar);
    var timeoutvar = setTimeout(() => this.closeThreadOnTimeout(room), thread.duration * 1000);
    this.storeThreads.set(room,{id: thread.id, duration: thread.duration, timeoutvar});
    console.log("Thread in room " + room + " already exist");
}
return new Promise((resolve, reject) => {
    return resolve();
});
```

 When he is no longer here, it will close it. 

```javascript
// interactive false
else {
    console.log("Interactive false");
    return this.closeThread(room);
}
```

So there is only one thread per channel/room. Before starting a new one in a channel/room, the previous one need to be close.

If a thread has timeout, the thread will be in closed in the adapter and it will send a message to the brain to close the thread on the side of the brain :

```javascript
closeThreadOnTimeout(room) {
    if (this.storeThreads.has(room)) {
        const thread_id = this.storeThreads.get(room).id;
        this.storeThreads.delete(room);
        // Send the close thread message to the brain to close the thread associated to the thread id
        this.socket.emit('close-thread-on-timeout', thread_id, (message) => {
            this.robot.messageRoom(room, message || "Le thread pour la conversation courante a expiré :( ");
        });
    } else {
        console.log("> [ERROR] No thread with the room specified, something went wrong :thinking: ")
    }
    return;
}
```

The complete thread handler file can be found here : [Thread file in Adapter project](https://gitlab.intech.lu/arachne-bot/Adapter-RocketChat/blob/master/scripts/thread.js)

## Hook handler

There is some commands to get/delete the hooks from the rocketchat.

To get the hooks in the room you are sending the message, the command is :

```
+bot hooks get
```

Then to delete a hooks, the command is :

```
+bot hooks delete [hookID]
```

## Link with Arachne by token identification

The link between Arachne and the adapter is made with a web socket to handle the hooks.

Foremost, Arachne has a security to access its API routes. So the adapter need a registered token to contact Arachne. 

```javascript
const bot_token = process.env.BOT_TOKEN || "";
```

Then , when the socket that link the adapter and arachne is initialized, the token is inserted as a header.

```javascript
const socket = io(api_url, {
        autoConnect: true,
        reconnection: true,
        transportOptions: {
            polling: {
                extraHeaders: {
                    'x-access-token': bot_token
                }
            }
        }
    });
```

## Installation

To install the adapter you need : 
- An instance of a RocketChat running with a bot user defined.
- An instance of arachne running.
- An adapter token from arachne.
- A node/npm environment.

First, you need to clone the adapter project : [Adapter project](https://gitlab.intech.lu/arachne-bot/Adapter-RocketChat)

Install the npm packages of the project with 
```
npm install
```

Then, create a file in the root folder named `start.cmd` or `start.sh` ( depending if you're using windows or Linux).

In this file, print the following code : 
```
set ROCKETCHAT_ROOM=''
set LISTEN_ON_ALL_PUBLIC=true
set ROCKETCHAT_USER=yourBotUser
set ROCKETCHAT_PASSWORD=yourBotPassword
set ROCKETCHAT_URL=http://localhost:3000
set RESPOND_TO_EDITED=true
set RESPOND_TO_DM=true
set API_HOST=localhost
set API_PORT=5002
set BOT_TOKEN=yourToken
bin\hubot.cmd -a rocketchat
```

Then modify the code with your own Rocketchat user/password, the Rocketchat url you're using. The url/port of Arachne you're using and finally your token from arachne.

When everything is set, you can start you're adapter by starting your cmd/sh file.

```
start.cmd
## OR
start.sh
```