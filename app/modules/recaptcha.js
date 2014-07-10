var config = require("app/config");
var Recaptcha = require('re-captcha');

var PUBLIC_KEY  = config.recaptcha.publickey;
var PRIVATE_KEY = config.recaptcha.privatekey;
var recaptcha = new Recaptcha(PUBLIC_KEY, PRIVATE_KEY);

module.exports = recaptcha;
