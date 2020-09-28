const express = require("express");
const redis_service = require('./services/redis_service');
const mysql_service = require('./services/mysql_service');
const bodyParser = require("body-parser");
const valdate = require("./lib/valdate");
const app = express();
const jsonParser = bodyParser.json();

require('dotenv').config();

app.post('/generate', jsonParser, function (req, res) {

    (async () => {
        try {
            if (!req.body.url) {
                res.status(400).json({ msg: 'no url data input.' });
            }

            if (!valdate.isUrl(req.body.url)) {
                res.status(400).json({ msg: 'url format error,place check your url input.' });
            }

            if (valdate.isMyShortUrl(req.body.url)) {
                res.status(400).json({ msg: 'you can not inpu a short url.' });
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
                let data = await mysql_service.getShortId(longUrl);
                if(data.length > 0){
                    shortId =  data[0].short_url;
                }
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
                res.status(201).json({ content: shortUrl, msg: 'success' });
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ msg: 'intral server error' });
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
                let data = await mysql_service.getLongUrl(shortId);
                if(data.length > 0){
                    longUrl =  data[0].long_url;
                }
            }
            if (longUrl === null) {
                res.status(404).json({ msg: 'short url resource not found.' });
            } else {
                //回寫redis
                await redis_service.addUrlMapping(shortId, longUrl);
                res.redirect(302, longUrl);
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ msg: 'intral server error' });
        }
    })();

})

var port = process.env.PORT || 8080;
app.listen(port);
