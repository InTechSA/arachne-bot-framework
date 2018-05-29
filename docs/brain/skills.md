# Skills

Skills are small scripts executed by the brain node server. They expose their commands and intents. Skills are automatically loaded by the bot on startup, and may be added at runtime, or removed/disabled.

Skills are edited from with the dashboard (or using the arachne API). You can edit their code or their secret variables (like token for external services).

Skill code and secrets are stored locally in the `/logic/skills` folder only for runtime purposes. Skills are persisted in the brain database, and will load these distants skills at startup. **Therefore editing local files WILL NOT persist modifications ! You MUST use the dashboard or the brain API.**

See the [api documentation](/brain/api.md#skills) for the complete list of endpoints available to manage skills.

## Use skill commands from within another skill
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

> Don't forget to catch the error, in case the command was deactivated!

Anything outside the `message` object returned by a skill will never be sent to any adapter, but might be accessible to other skill using the overseer command handling.

