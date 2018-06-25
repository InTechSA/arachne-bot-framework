# Hooks

Skills can anchor hooks with adapters that implements them. They can register a new Hook using the `skill.createHook()` method. The creator can add a third parameter ( a string ), to specify the string that the adapter will return when closing this hook, example : "This hook can be called only once !". This will return a Promise to the created hook. The hook will not be valid, and the adapter must confirm before it can be executed. To request a hook, the `message` object returned by the skill must contain `request_hook: true` and `hook: <hook>`. Adapters should understand the request when parsing the message, and will validate the hook. Then, the skill will be able to execute the hook with `skill.useHook(hook_id, message)` (which is a Promise). The creator can add a third parameter : `{deleteHook: true}` to delete the hook after it execution.

> Nota Bene: It is the responsability of the skill to handle Promise rejections with personnalized error messages.

When executing a hook, in case of an error, you will receive an error code that you can use to update your skill's storage. For instance, if you catch `NO_HOOK`, it means the Hook was deleted by the hub, or `NO_CONNECTOR_LINKED` if no connector accepted the hook, or `NO_CONNECTOR_ONLINE` if the linked connector could not be reached.


## Example
In this example, we request a new Hook and set a alarm that will display a message in the channel.

```javascript
module.exports = (skill) => {
  const schedule = skill.loadModule("node-schedule");

  skill.setDescription("Set and manage alarms.");

  /*
   * Will not persist the alarm, we should add the alarm to the storage here.
   */
  skill.addCommand("alarm", "set-alarm", ({ phrase, data }) => {
    return Promise.resolve().then(() => {
      let time = new Date();
      let text = "";

      try {
        const [timeString, ...textArray] = phrase.split(" ");
        text = textArray ? textArray.join(" ") : "";
        
        let [hours, minutes] = timeString.split(/[:h\-]/i);
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (isNaN(hours) || hours < 0 || hours > 24) {
          throw "Invalid hour format.";
        }
        if (isNaN(minutes) || minutes < 0 || minutes >= 60) {
          throw "Invalid minutes format.";
        }
        time.setHours(hours, minutes, 0, 0);


        return skill.createHook("Alarm rang, hook removed.").then(hook => {
          schedule.scheduleJob(time, () => {
            skill.useHook(hook._id, {
              message: "Alarm",
              text: text
            }, { deleteHook: true }).catch(err => skill.log(err));
          });

          return {
            message: {
              text: "Alarm set!"
            }
          }
        });
      } catch (e) {
        return {
          message: {
            title: "Invalid time format.",
            text: "Type `!alarm hh:mm` to create a new alarm."
          }
        }
      }


    });
  }, {
    description: "Set a one-time alarm.",
    parameters: [
      {
        position: 0,
        name: "time",
        example: "16:40",
        description: "Time to set the alarm"
      },
      {
        position: 1,
        name: "text",
        example: "It's tea time!",
        description: "Text to send with the alarm."
      }
    ]
    examples: [
      {
        phrase: "!alarm 16h Tea Time!",
        action: "Will say 'Tea Time!' in the channel at 16h00."
      }
    ]
  });
}
```
