var oauth2  = require('app/oauth2/oauth2');

function setup(app) {
    app.namespace('/oauth/v2', function(){
        app.post('/token', oauth2.token);
    });
}

module.exports = setup;
