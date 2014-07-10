var UserModel           = require('app/users/models/UserModel');

var log = require('app/modules/logger');
var rate = require('app/modules/rate');

var postFilesLimiter = rate(10, 20);
function postFiles(req, res) {

    res.send('tak');
}


function setup(app) {
    app.namespace('/api/v1', function(){
        app.post('/files', postFilesLimiter, postFiles);
    });
}

module.exports = setup;
