const express = require("express");
const redis_service = require('./services/redis_service');
const mysql_service = require('./services/mysql_service');
const bodyParser = require("body-parser");
const valdate = require("./lib/valdate");
const app = express();
const jsonParser = bodyParser.json();

require('dotenv').config();

const SUCCESS_CODE = 1;
const FAILED_CODE = 0;

app.post('/generate', jsonParser, function (req, res) {

    (async () => {
        try {
            if (!req.body.url) {
                res.status(200).json({ code: FAILED_CODE, msg: 'no url data input.' });
            }

            if (!valdate.isUrl(req.body.url)) {
                res.status(200).json({ code: FAILED_CODE, msg: 'url format error,place check your url input.' });
            }

            if (valdate.isMyShortUrl(req.body.url)) {
                res.status(200).json({ code: FAILED_CODE, msg: 'you can not inpu a short url.' });
            }

            longUrl = req.body.url;
            let shortId = null;
            let isRedisExistUrl = false;

            //查看redis有沒有已經生成的短網址
            shortId = await redis_service.getShortId(longUrl);

            //查看mysql有沒有已經生成的短網址
            if (shortId !== null) {
                isRedisExistUrl = true;
            } else {
                shortId = await mysql_service.getShortId(longUrl);
            }

            if (shortId === null) {
                //若都沒有，則生成新的短網址
                shortId = await mysql_service.newShortId(longUrl);
            }
            if (shortId !== null) {
                let shortUrl = process.env.APP_URL + shortId;
                //寫redis
                if (!isRedisExistUrl) {
                    await redis_service.addUrlMapping(shortId, longUrl);
                }
                res.status(200).json({ code: SUCCESS_CODE, content: shortUrl, msg: 'success' });
            } else {
                res.status(200).json({ code: FAILED_CODE, msg: 'generate failed' });
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ code: FAILED_CODE, msg: 'intral server error' });
        }

    })();
})

app.get('/:shortId', function (req, res) {

    let shortId = req.params.shortId;

    (async () => {
        try {
            let longUrl = null;
            //先到redis取long url
            longUrl = await redis_service.getLongUrl(shortId);
            //取不到再到mysql取資料
            if (longUrl === null) {
                longUrl = await mysql_service.getLongUrl(shortId);
            }
            if (longUrl === null) {
                res.status(200).json({ code: FAILED_CODE, msg: 'short url resource not found.' });
            } else {
                //回寫redis
                await redis_service.addUrlMapping(shortId, longUrl);
                res.redirect(302, longUrl);
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ code: FAILED_CODE, msg: 'intral server error' });
        }
    })();

})

var port = process.env.PORT || 8080;
app.listen(port);
