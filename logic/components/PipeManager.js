'use strict';
const logger = new (require('./../../logic/components/Logger'))();

/**
 * Manager for Web Pipes. Pipes allow skills to receieve events from external services via POST HTTP request to the brain.
 */
module.exports.PipeManager = class {
    constructor(SkillManager, hookManager, pipeController) {
        this.pipeController = pipeController || require('../../database/controllers/pipeController');
        this.SkillManager = SkillManager;
        this.hookManager = hookManager;
        this.codes = {
            EXISTING_PIPE: 1,
            NO_PIPE: 404
        }
    }

    /**
     * Instanciate a new pipe for a skill.
     */
    create(skill, handler, secret = null, hook = null) {
        return this.pipeController.create(skill, handler, secret, hook);
    }

     /**
     * Instanciate a new pipe and a new hook for a skill.
     */
    createWithHook(skill, handler, secret = null) {
        return this.hookManager.create(skill).then(hook => {
            return this.pipeController.create(skill, handler, secret, hook._id).then(pipe => {
                pipe.hook = hook;
                return pipe;
            });
        }).catch((err) => {
            logger.error(err);
            throw err;
        });
    }

    /**
     * Remove an existing pipe.
     */
    remove(skill, identifier) {
        return this.pipeController.remove(skill, identifier);
    }

    /**
     * Find an existing pipe by its skill an identifier
     */
    find(skill, identifier) {
        return this.pipeController.find(skill, identifier);
    }

    /**
     * Get all pipes for a skill.
     */
    getForSkill(skill) {
        return this.pipeController.get_for_skill(skill);
    }

    /**
     * Clear all pipes for a skill.
     */
    clearForSkill(skill) {
        return this.pipeController.remove_for_skill(skill);
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
                logger.info(`Transmitting pipe ${identifier} for skill ${skillName}`);
                return skill.pipes[pipe.handler].handler(identifier, { hookId: pipe.hookID, data, headers });
            });
        });
    }
}
