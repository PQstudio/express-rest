var oauth2orize         = require('oauth2orize');
var facebookExchange    = require('app/oauth2/oauth2orize/exchange/facebook');
var passport            = require('passport');
var crypto              = require('crypto');
var config              = require('app/config');
var UserModel           = require('app/users/models/UserModel');
var ClientModel         = require('app/oauth2/models/ClientModel');
var AccessTokenModel    = require('app/oauth2/models/AccessTokenModel');
var RefreshTokenModel   = require('app/oauth2/models/RefreshTokenModel');
var request             = require('request');
var acl = require('app/modules/acl');
var log = require('app/modules/logger');

require('app/oauth2/auth');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Exchange username & password for access token.
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
    UserModel.findOne({ email: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!user.checkPassword(password)) { return done(null, false); }

        generateTokens(user, client, done);
    });
}));

// Exchange refreshToken for access token.
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
    RefreshTokenModel.findOne({ token: refreshToken }, function(err, token) {
        if (err) { return done(err); }
        if (!token) { return done(null, false); }

        UserModel.findById(token.userId, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }

            generateTokens(user, client, done);
        });
    });
}));

// exchange facebook access token for oauth2 access token.
server.exchange(facebookExchange(function(client, facebookToken, scope, done){
    request('https://graph.facebook.com/v2.0/me?access_token='+facebookToken, function (error, response, body) {
        if(error || response.statusCode != 200) {
            done(error);
        }

        var json = JSON.parse(body);

        var facebookId = json.id;
        var email = json.email;

        // check if user with given facebook id already exists
        UserModel.findOne({ facebookId: facebookId }, function(err, user) {
           if (err) { return done(err); }
           if (!user) { 
               // facebook id doesn't exists in database
               // check if user with given email exists
               UserModel.findOne({ email: email}, function(err, user) {
                   if (err) { return done(err); }
                   if (!user) { 
                       // user with given email doesn't exist
                        var user = new UserModel({
                            email: email,
                            facebookId: facebookId,
                            facebookAccessToken: facebookToken
                        });

                        user.save(function (err) {
                            if (!err) {
                                log.info("user created");
                                
                                acl.allow(user.id, 'users/'+user.id, ['view', 'edit', 'delete']);
                                acl.addUserRoles(user.id, user.id)

                                generateTokens(user, client, done);
                            } else {
                                console.log(err);
                                done(null, false);
                            }
                        });
                   } else {
                       // user with given email exists
                       if(user.facebookId === null || user.facebookId === "" || user.facebookId === undefined) {
                           user.facebookId = facebookId;
                           user.facebookAccessToken = facebookToken;

                           user.save(function (err, user) {
                               if (err) return done(null, false);

                               generateTokens(user, client, done);
                           });
                       }
                   }
               });
           } else {
               // facebook id exists in database
               user.facebookAccessToken = facebookToken;

               user.save(function (err, user) {
                   if (err) return done(null, false);

                   generateTokens(user, client, done);
               });
           }
        });
    });
}));

var generateTokens = function(user, client, done) {
     RefreshTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
         if (err) return done(err);
     });
     AccessTokenModel.remove({ userId: user.userId, clientId: client.clientId }, function (err) {
         if (err) return done(err);
     });
  
     var tokenValue = crypto.randomBytes(32).toString('base64');
     var refreshTokenValue = crypto.randomBytes(32).toString('base64');
     var token = new AccessTokenModel({ token: tokenValue, clientId: client.clientId, userId: user.userId });
     var refreshToken = new RefreshTokenModel({ token: refreshTokenValue, clientId: client.clientId, userId: user.userId });
     refreshToken.save(function (err) {
         if (err) { return done(err); }
     });
     var info = { scope: '*' }
     token.save(function (err, token) {
         if (err) { return done(err); }
         done(null, tokenValue, refreshTokenValue, { 'expires_in': config.oauth2.tokenLifetime });
     });
}

// token endpoint
exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]
