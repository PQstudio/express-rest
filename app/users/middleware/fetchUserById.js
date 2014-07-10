var UserModel = require('app/users/models/UserModel');

var fetchUserById = function(req, res, next) {
    UserModel.findById(req.params.id, function(err, user) {
        if(err) {
			res.json(500, {error: err});
		}
        if(!user) {
			res.json(404, {error: {message: "User with id " + req.params.id + " doesn't exist"}});
		}

        req.userById = user;
        next();
    });
};


module.exports = fetchUserById;
