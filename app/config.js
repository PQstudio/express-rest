var config = module.exports;
var PRODUCTION = process.env.NODE_ENV === "production";

config.express = {
  port: process.env.EXPRESS_PORT,
  ip: "0.0.0.0"
};

config.mongodb = {
  port: process.env.MONGODB_PORT,
  host: process.env.MONGODB_HOST
};

config.oauth2 = {
  tokenLifetime: 3600
};

if (PRODUCTION) {
  //use different mongodb in production here, for example
}
