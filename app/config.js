var config = module.exports;
var PRODUCTION = process.env.NODE_ENV === "production";

config.express = {
  port: process.env.EXPRESS_PORT,
  ip: "0.0.0.0"
};

config.mongodb = {
  port: process.env.MONGODB_PORT,
  host: process.env.MONGODB_HOST,
  username: process.env.MONGODB_USERNAME,
  password: process.env.MONGODB_PASSWORD,
  db: process.env.MONGODB_DATABASE,
  url: process.env.MONGO_URL
};

config.redis = {
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST
};

config.oauth2 = {
  tokenLifetime: 3600
};

config.recaptcha = {
  publickey: process.env.RECAPTCHA_PUBLICKEY,
  privatekey: process.env.RECAPTCHA_PRIVATEKEY
}

config.mailgun = {
  apikey: process.env.MAILGUN_APIKEY
}


config.app = {
    fileUpload: {
        tmpPath: "data/uploads/tmp/",
        profile: {
            path: "data/uploads/profile/",
            allowedMimeTypes: ['application/vnd.ms-excel'],
            maxSize: 2000000
        }
    }
}

if (PRODUCTION) {
  //use different mongodb in production here, for example
}
