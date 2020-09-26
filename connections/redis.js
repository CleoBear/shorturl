const redis = require('redis');
require('dotenv').config();

let redis_client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST, process.env.REDIS_OPTS);
    redis_client.on("error", function (err) {
    console.log("Error:" + err);
});
redis_client.auth(process.env.REDIS_PASS);//密碼驗證

module.exports = redis_client;