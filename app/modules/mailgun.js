var Mailgun = require('mailgun').Mailgun;
var config = require("app/config");

var mg = new Mailgun(config.mailgun.apikey);

module.exports = mg;
