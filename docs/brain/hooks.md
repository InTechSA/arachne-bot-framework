# Hooks

Skills can anchor hooks with adapters that implements them. They can register a new Hook with the _HookManager_ accessible via the _overseer_: `overseer.HookManager.create("skill_name")`.The creator can add a third parameter ( a string ), to specify the string that the adapter will return when closing this hook, example : "This hook can be called only once !". This will return a Promise to the created hook. The hook will not be valid, and the adapter must confirm before it can be executed. To request a hook, the `message` object returned by the skill must contain `request_hook: true` and `hook: <hook>`. Adapters should understand the request when parsing the message, and will validate the hook. Then, the skill will be able to execute the hook with `overseer.HookManager.execute(hook_id, message)` (which is a Promise). The creator can add a third parameter : `{deleteHook: true}` to delete the hook after it execution.

> Nota Bene: It is the responsability of the skill to handle Promise rejections with personnalized error messages.

When executing a hook, in case of an error, you will recieve an error code that you can use to update your skill's storage. For instance, if you catch `overseer.HookManager.codes.NO_HOOK`, it means the Hook was deleted by the hub, or `NO_CONNECTOR_LINKED` if no connector accepted the hook, or `NO_CONNECTOR_ONLINE` if the linked connector could not be reached.


## Example
In this example, we request a new Hook and set a alarm that will display a message in the channel.

```javascript
overseer.HookManager.create("skill_name","Only one hook permitted, closing it after the execution !").then((hook) => {
  let alarm = new Date(new Date() + 5*60000); // Set a alarm in 5 minutes.
  schedule(alarm, () => {
    overseer.HookManager.execute(hook._id, {
      message: {
        title: "Ring!",
        text: "That's an alarm, folks!"
      }
    }, {deleteHook: true}).catch((err) => {
        // You may want to update your skill storage in case of a rejection
        // (eg. removing the hook from your storage.)
    });
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
