const express = require("express");
const redis_client = require('./connections/redis');
const bodyParser = require("body-parser");
const base62 = require("base62/lib/ascii");
const pool = require("./connections/mysql");
const valdate = require("./lib/valdate");

require('dotenv').config();

const app = express();
const jsonParser = bodyParser.json();

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
    let longUrl = req.body.url;
    
    pool.getConnection(function(error,connection){
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
                    redis_client.set(shortId, longUrl);
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
        
    });
})

app.get('/:shortId', function(req, res){

    let shortId = req.params.shortId;

    redis_client.get(shortId, function (error, results) {

        if (error !== null) {throw error;};//沒錯誤,會是 null
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
                        redis_client.set(shortId, data[0].long_url); //回寫redis
                        res.redirect(302, data[0].long_url);
                    }else{
                        res.status(200).json({code:'0', msg:'short url resource not found.'});
                    }
                });
            });
        }
    });
})

app.use(function(req, res, next){
    res.status(400).send('page not found');
})
app.use(function(err, req, res, next){
    console.log(err);
    
    res.status(500).send('server error');
})

var port = process.env.PORT || 8080;
app.listen(port);
