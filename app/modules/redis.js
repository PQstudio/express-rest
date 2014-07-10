var config = require("app/config");
var redis = require("redis");

client = redis.createClient(config.redis.port, config.redis.host);

module.exports = client;
