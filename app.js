const express = require("express");
const redis_client = require('./connections/redis');
const bodyParser = require("body-parser");
const base62 = require("base62/lib/ascii");
const pool = require("./connections/mysql");
const valdate = require("./lib/valdate");
const app = express();
const jsonParser = bodyParser.json();

require('dotenv').config();

const REDIS_PREFIX = 'short_url:';
const PREFIX_SHORT_TO_LONG = REDIS_PREFIX + 'short_long:';
const PREFIX_LONG_TO_SHORT = REDIS_PREFIX + 'long_short:';

app.post('/', function(req, res){
    res.send('short URL API, please goto /generate to create.');
})

app.post('/generate', jsonParser, function(req, res){

    if(!req.body.url){
        res.status(200).json({code:'0', msg:'no url data input.'});
    }

    if(!valdate.isUrl(req.body.url)){
        res.status(200).json({code:'0', msg:'url format error,place check your url input.'});
    }

    if(valdate.isMyShortUrl(req.body.url)){
        res.status(200).json({code:'0', msg:'you can not inpu a short url.'});
    }

    let longUrl = req.body.url;
    
    pool.getConnection(function(error,connection){
        
        //先查有沒有已經生成的短網址
        redis_client.get(PREFIX_LONG_TO_SHORT + longUrl, function (error, results) {

            if (error !== null) {throw error;}
            if(results){
                let shortUrl = process.env.APP_URL + results;
                res.status(200).json({code:'1', content:shortUrl, msg:'success'});
            }else{
                pool.getConnection(function(error,connection){
                    if (error) {throw error;};
                    //redis 找不到再到db撈
                    connection.query('SELECT short_url FROM url_map WHERE long_url = ?', longUrl , function(error, results, fields){
                        connection.release();
                        if (error) {throw error;};
                        let data = (JSON.parse(JSON.stringify(results)));
                        if(data.length > 0){
                            //回寫redis
                            let shortId = data[0].short_url;
                            let shortUrl = process.env.APP_URL + shortId;
                            redis_client.set(PREFIX_SHORT_TO_LONG + shortId, longUrl);
                            redis_client.set(PREFIX_LONG_TO_SHORT + longUrl, shortId);
    
                            res.status(200).json({code:'1', content:shortUrl, msg:'success'});
                        }else{
                            //產生新的對應關係
                            connection.beginTransaction(function(error) {
                                if (error) {
                                    connection.rollback(function() {
                                        connection.release();
                                        throw error;
                                    });
                                }
                                connection.query('INSERT INTO url_map SET long_url=?', longUrl, function (error, results, fields) {
                                    if (error) {
                                        connection.rollback(function() {
                                            connection.release();
                                            throw error;
                                        });
                                    }
                                    let id = results.insertId;
                                    let shortId = base62.encode(results.insertId + Math.floor(new Date() / 1000));
                                    connection.query('UPDATE url_map SET short_url=? WHERE id = ?', [shortId, id] , function(error, results, fields){
                                    
                                        if (error) {
                                            connection.rollback(function() {
                                                connection.release();
                                                throw error;
                                            });
                                        }
                                        let shortUrl = process.env.APP_URL + shortId;
                                        //寫入redis
                                        redis_client.set(PREFIX_SHORT_TO_LONG + shortId, longUrl);
                                        redis_client.set(PREFIX_LONG_TO_SHORT + longUrl, shortId);
                    
                                        res.status(200).json({code:'1', content:shortUrl, msg:'success'});
                                        
                                        connection.commit(function(error) {
                                            if (error) {
                                                connection.rollback(function() {
                                                    connection.release();
                                                    throw error;
                                                });
                                            } else {
                                                connection.release();
                                            }
                                        });
                                    });
                                });
                            });
                        }
                    });
                });
            }
        });
    });
})

app.get('/:shortId', function(req, res){

    let shortId = req.params.shortId;

    redis_client.get(PREFIX_SHORT_TO_LONG + shortId, function (error, results) {

        if (error !== null) {throw error;}
        if(results){
            res.redirect(302, results);
        }else{
            pool.getConnection(function(error,connection){
                if (error) {throw error;};
                //redis 找不到再到db撈
                connection.query('SELECT long_url FROM url_map WHERE short_url = ?', shortId , function(error, results, fields){
                    connection.release();
                    if (error) {throw error;};
                    let data = (JSON.parse(JSON.stringify(results)));
                    if(data.length > 0){
                        //回寫redis
                        redis_client.set(PREFIX_SHORT_TO_LONG + shortId, data[0].long_url);
                        redis_client.set(PREFIX_LONG_TO_SHORT + data[0].long_url, shortId);

                        res.redirect(302, data[0].long_url);
                    }else{
                        res.status(404).json({code:'0', msg:'short url resource not found.'});
                    }
                });
            });
        }
    });
})

app.use(function(req, res, next){
    res.status(404).send('api not found');
})
app.use(function(err, req, res, next){
    console.log(err);
    res.status(500).send('server error');
})

var port = process.env.PORT || 8080;
app.listen(port);
