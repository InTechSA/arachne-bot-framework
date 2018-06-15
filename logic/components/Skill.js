module.exports = class Skill {
    constructor(name, manager) {
        this.manager = manager;

        this.name = name;

        this.commands = {};
        this.intents = {};
        this.interactions = {};
        this.pipes = {};
    }

    //////////////////////////////////////////////////////
    // REGISTRATION OF HANDLERS

    /** Register a new command for this skill.
     * 
     * @param {String} cmd Command word typed by the user.
     * @param {String} name Name of the command to be displayed.
     * @param {Function} handler Function to be called with { phrase, data } as parameters.
     */
    addCommand(cmd, name, handler) {
        if (Object.keys(this.commands).includes(cmd)) {
            throw new Error("Command word is already defined for skill.");
        }
        this.commands[cmd] = {
            name,
            cmd,
            handler
        }
    }

    /** Register a new intent for this skill.
     * 
     * @param {String} slug Slug of the intent, returned by the NLU service.
     * @param {String} name Name of the intent to be displayed.
     * @param {Function} handler Function to be called with { entites, data } as parameters.
     */
    addIntent(slug, name, handler) {
        if (Object.keys(this.intents).includes(slug)) {
            throw new Error("Intent slug is already handled for this skill.");
        }
        this.intents[slug] = {
            name,
            slug,
            handler
        }
    }

    /** Register a new interaction for this skill.
     * 
     * @param {String} name Name of the interaction (should be name of the handler if any).
     * @param {Function} handler Function to be called with (thread, { phrase, data }) as parameters.
     */
    addInteraction(name, handler) {
        if (this.interactions[name]) {
            throw new Error(`Interaction ${name} already defined for skill ${this.name}.`);
        }
        this.interactions[name] = {
            name,
            handler
        }
    }

    /** Register a new pipe for this skill.
     * 
     * @param {String} name Name of the pipe (should be name of the handler if any).
     * @param {Function} handler Function to be called with (pipeIdentifier, { data }) as parameters.
     */
    addPipe(name, handler) {
        if (this.pipes[name]) {
            throw new Error(`Pipe ${name} already defined for skill ${this.name}.`);
        }
        this.pipes[name] = {
            name,
            handler
        }
    }

    //////////////////////////////////////////////////////
    // ACTIONS

    /** Handle a command of this skill.
     * 
     * @param {String} cmd Command word typed by user.
     * @param {Object} params Params given to the command.
     * @param {String} params.phrase Command phrase without the cmd word.
     * @param {Object} params.data Data object given by the connector and populated by the brain.
     * @return {Promise} Promise to the response object: { message: { title, text }, response: {}}.
     */
    handleCommand(cmd, { phrase = {}, data = {} } = {}) {
        return Promise.resolve().then(() => {
            // Command might be activated, but not the skill. Check the skill first.
            if (!this.active) {
                throw new Error(`Skill ${this.name} is not active.`)
            }

            if (!this.commands[cmd]) {
                throw new Error(`Command ${cmd} is not defined.`);
            }

            if (!this.commands[cmd].active) {
                throw new Error(`Command ${cmd} is not active.`);
            }

            return this.commands[cmd].handler({ phrase, data });
        });
    }

    /** Handle an intent of this skill.
     * 
     * @param {String} slug Intent slug returned by NLU service.
     * @param {Object} params Params given to the intent handler..
     * @param {Object} params.entities Map of entities found: entity-name -> [entitiy-values]
     * @param {Object} params.data Data object given by the connector and populated by the brain.
     * @return {Promise} Promise to the response object: { message: { title, text }, response: {}}.
     */
    handleIntent(slug, { entities = {}, data = {} } = {}) {
        // Intent might be activated, but not the skill. Check the skill first.
        return Promise.resolve().then(() => {
            if (!this.active) {
                throw new Error(`Skill ${this.name} is not active.`)
            }

            if (!this.intents[slug]) {
                throw new Error(`Intent ${slug} is not defined.`);
            }

            if (!this.intents[slug].active) {
                throw new Error(`Intent ${slug} is not active.`);
            }

            return this.intents[slug].handler({ entities, data });
        });
    }

    /** Request the creation of a new hook.
     * 
     */
    createHook() {
        return this.manager.createHook(this.name);
    }

    /** Use an existing hook.
     * 
     */
    useHook() {
        return this.manager.useHook();
    }

    /** Request the creation of a new pipe.
     * 
     */
    createPipe(withHook = false) {
        return this.manager.createPipe(this.name);
    }

    /** Execute a command from this or another skill.
     * 
     * @param {String} cmd 
     * @param {objet} params
     * @param {String} params.phrase Command phrase without the cmd word to execute.
     * @param {Object} params.data Data object given by the connector and populated by the brain.
     */
    execute(cmd, { phrase = {}, data = {} } = {}) {
        return this.manager.handleCommand(cmd, { phrase, data });
    } 
}