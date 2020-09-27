const redis_client = require('../connections/redis');

const REDIS_PREFIX = 'short_url:';
const PREFIX_SHORT_TO_LONG = REDIS_PREFIX + 'short_long:';
const PREFIX_LONG_TO_SHORT = REDIS_PREFIX + 'long_short:';

exports.getLongUrl = function getLongUrl(shortId) {    
    return new Promise((resolve, reject) => {
        redis_client.get(PREFIX_SHORT_TO_LONG + shortId, function (error, results){
            if (error !== null) {
                reject(error);
            }
            if(results){
                resolve(results);
            }else{
                resolve(null);
            }
        });
    });
};

exports.getShortId = function getShortId(longUrl) {    
    return new Promise((resolve, reject) => {
        redis_client.get(PREFIX_LONG_TO_SHORT + longUrl, function (error, results) {
            if (error !== null) {
                reject(error);
            }
            if(results){
                resolve(results);
            }else{
                resolve(null);
            }
        });
    });
};

exports.addUrlMapping = function addUrlMapping(shortId, longUrl) {    
    return new Promise((resolve, reject) => {
        //寫入redis
        redis_client.set(PREFIX_SHORT_TO_LONG + shortId, longUrl);
        redis_client.set(PREFIX_LONG_TO_SHORT + longUrl, shortId);
        resolve(true);
    });
};
