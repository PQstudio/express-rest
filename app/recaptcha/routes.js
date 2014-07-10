var recaptcha = require("app/modules/recaptcha");

var log = require('app/modules/logger');
var rate = require('app/modules/rate');
var redis = require("app/modules/redis");
var mg = require("app/modules/mailgun");


var postRemoveLimitLimiter = rate(100, 3600);
function removeLimit(req, res) {
    var challenge = req.body.challenge;
    var response = req.body.response;
    var remoteip = req.connection.remoteAddress;

    var data = {
        remoteip: remoteip,
        challenge: challenge,
        response: response
    };

    recaptcha.verify(data, function(err) {
       if (err) {
         res.status(422).json({error: err.name});
       } else {
        redis.keys('rate-limit:'+remoteip+'*', function(err, response) {
            console.log(response);   
            response.forEach(function(key) {
                redis.del(key, function(err, response) {

                });        
            });
            res.status(200).send();
        });
       }
     });
}

function setup(app) {
    app.namespace('/api/v1', function(){
        app.post('/rate-limit/remove', postRemoveLimitLimiter, removeLimit);
    });
}

module.exports = setup;
