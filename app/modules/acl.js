var acl = require('acl');
var db = require("app/modules/db");
var redis = require('app/modules/redis');

//acl = new acl(new acl.redisBackend(redis, "acl"));
acl = new acl(new acl.mongodbBackend(db.db, "acl"));


module.exports = acl;
