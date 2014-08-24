var oauth2  = require('app/oauth2/oauth2');
var config                  = require('app/config');
var AccessTokenModel    = require('app/oauth2/models/AccessTokenModel');

function postCheckAccessToken(req, res, next) {
    var accessToken = req.headers.authorization.substring(7);
    AccessTokenModel.findOne({ token: accessToken }, function(err, token) {
        if (err) { return next(err); }
        if (!token) { 
            res.status(200).json({ status: "unauthorized" });  
        } else {
            if( Math.round((Date.now()-token.created)/1000) > config.oauth2.tokenLifetime ) {
                AccessTokenModel.remove({ token: accessToken }, function (err) {
                    if (err) return next(err);
                });
                res.status(200).json({ status: "token_expired" });  
            } else {
                res.status(200).json({ status: "authorized" });  
            }
        }

    });

}

function putInvalidateAccessToken(req, res, next) {
    var accessToken = req.headers.authorization.substring(7);

    AccessTokenModel.remove({ token: accessToken }, function (err, token) {
        if (err) return next(err);
        if (!token) { 
            res.status(404).json({ status: "token_doesnt_exist" });  
        } else {
            res.status(204).json({});  
        }
    });

}

function setup(app) {
    app.namespace('/oauth/v2', function(){
        app.post('/token', oauth2.token);
        app.post('/token/check', postCheckAccessToken);
        app.put('/token/invalidate', putInvalidateAccessToken);
    });
}

module.exports = setup;
