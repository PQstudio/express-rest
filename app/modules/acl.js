var acl = require('acl');
var db = require("app/modules/db");
var redis = require('app/modules/redis');

acl = new acl(new acl.mongodbBackend(db.db, "acl"));

function check(userId, path, action, next, cb) {
    acl.isAllowed(userId, path, action).then(function(result) {
        if(result) {
            cb();
        } else {
            var err = new Error();
            err.status = 403;
            err.inner = new Error('Access forbidden');
            err.message = 'Access forbidden';
            err.code = 'access_forbidden';
            next(err);
        }
    })
    .catch(function(err) {
        next(err);
    });
}

module.exports = acl;
module.exports.check = check;
