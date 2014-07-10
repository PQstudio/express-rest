var redis = require("app/modules/redis");
var rate = require("express-rate/lib/rate");

var redisHandler = new rate.Redis.RedisRateHandler({client: redis});

var createLimit = function(limit, interval) {
    return rate.middleware({handler: redisHandler, interval: interval, limit: limit, onLimitReached: 
        function (req, res, rate, limit, resetTime, next) {
            res.json(429, {error: 'Rate limit exceeded. Check headers for limit information.'});
        },
        getRouteKey: function(req) {
            return 'rate-limit:' + req.connection.remoteAddress + ':' + req.route.stack[0].method + ':' + req.route.path;
        }});
};

module.exports = createLimit;
