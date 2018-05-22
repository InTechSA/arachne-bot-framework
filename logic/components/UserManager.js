'ue strict';

exports.UserManager = class UserManager {
    constructor(userController) {
        this.userController = userController || require("./../../database/controllers/userController");
    }

    getAll() {
        return this.userController.get_all();
    }
};
