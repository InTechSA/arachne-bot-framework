'use strict';

/**
 * Manager for Web Pipes. Pipes allow skills to receieve events from external services via POST HTTP request to the brain.
 */
module.exports.PipeManager = class {
    constructor(SkillManager) {
        this.SkillManager = SkillManager;
        this.pipes = [];
        this.codes = {
            EXISTING_PIPE: 1,
            NO_PIPE: 404
        }
    }

    /**
     * Instanciate a new pipe for a skill.
     */
    create(skill, identifier, handler, secret = null) {
        return Promise.resolve().then(() => {        
            // Create a new pipe.
            const pipe = {
                skill,
                identifier,
                handler
            };
            if (secret) {
                pipe.secret = secret;
            }

            // Find a similar pipe.
            const index = this.pipes.findIndex(pipe => pipe.skill === skill && pipe.identifier === identifier);
            if (index >= 0) {
                // Replace pipe.
                this.pipes[index] = pipe;
            } else {
                // Push new pipe.
                this.pipes.push(pipe);
            }

            return pipe;
        });
    }

    /**
     * Remove an existing pipe.
     */
    remove(skill, identifier) {
        return Promise.resolve().then(() => {
            let index = this.pipes.findIndex(pipe => pipe.skill === skill && pipe.identifier === identifier);
            if (index == -1) {
                const error = new Error("No pipe found.");
                error.code = this.codes.NO_PIPE;
                throw error;
            }
            this.pipes.splice(index, 1);
            return;
        });
    }

    /**
     * Find an existing pipe by its skill an identifier
     */
    find(skill, identifier) {
        return Promise.resolve().then(() => {
            let pipe = this.pipes.find(pipe => pipe.skill === skill && pipe.identifier == identifier);

            if (!pipe) {
                const error = new Error("No pipe found.");
                error.code = this.codes.NO_PIPE;
                throw error;
            }
            return pipe;
        });
    }

    /**
     * Execute a pipe by its token. The skill will receive the pipe identifier, the pipe data and the pipe headers.
     */
    transmit(skillName, identifier, data, headers) {
        return this.find(skillName, identifier).then(pipe => {
            // Fetch skill.
            return this.SkillManager.getSkill(skillName).then(skill => {
                if (!skill.pipes || !Object.keys(skill.pipes).includes(pipe.handler)) {
                    const error = new Error("Pipe does no longer exist for skill.");
                    error.code = this.codes.NO_PIPE;
                    throw error;
                }
                // Execute pipe's skill handler if activated.
                console.log(`> [INFO] Transmitting pipe ${identifier} for skill ${skillName}`);
                return skill.pipes[pipe.handler].transmit(identifier, { data, headers });
            });
        });
    }
}
