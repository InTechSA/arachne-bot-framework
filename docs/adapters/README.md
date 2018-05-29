# Adapters
Adapters are basically just pipelines to transfer messages from the chat itself to the bot's brain. All they do is basically handling their own permissions (and self-commands like `join`) and differencing direct commands from natural language requests. Token must authenticate themselves through a valid token generated on the dashboard (in request header `x-access-token` or in body `token`).

Adapters can pass data to the brain using the `data: {}` object in body. Data will be passed to skill handlers. It is good practise to send an unique channel identifier and the name of the user that entered the command.

## Connecting to the Brain
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
