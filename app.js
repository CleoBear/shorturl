const db = require("./connections/firebase_admin")
const express = require("express");
const bodyParser = require("body-parser");
const base62 = require("base62/lib/ascii");
require('dotenv').config();

const app = express();
const jsonParser = bodyParser.json();
const path = 'base62urls';
const ref = db.ref();

app.post('/shorturl', jsonParser, function(req, res){
    let urlRef = ref.child(path);
    let longUrl = req.body.url;

    let count = 0,
        isExist = false,
        shortUrl,
        shortId;
        
    let timestamp = Math.floor(new Date() / 1000);

    ref.child('count').once("value", (snapshot)=>{
        count = (snapshot.val() === null) ? 0 : snapshot.val() ;
    }).then(()=>{
        shortId  = base62.encode(timestamp + (count + 1) );
        ref.child(path + '/' + count).once("value", (snapshot)=>{
            console.log(snapshot.key);
            if(snapshot.key !== null){
                isExist = true;
            }
        })
    }).then(()=>{
        if(isExist){
            res.status(200).json({code:'0', msg:'short url already exist'});
        }else{
            let savePath =  path + '/' + shortId ;
            console.log(longUrl);
            ref.child(savePath).set(longUrl).then(()=>{
                shortUrl = process.env.APP_URL + shortId;
                ref.child('count').set(count + 1);
                res.status(200).json({code:'1', content:shortUrl, msg:'success'});
            });
        }
    });

})

app.get('/:shortId', function(req, res){
    let urlRef = ref.child(path + '/' + req.params.shortId);
    urlRef.once("value", function(snapshot) {
        let longUrl = snapshot.val();
        if(longUrl === null){
            res.status(200).json({code:'0', msg:'short url resource not found.'});
        }else{
            res.redirect(302, longUrl);
        }
    });
})

app.use(function(req, res, next){
    res.status(400).send('頁面不存在');
})
app.use(function(err, req, res, next){
    console.log(err);
    res.status(500).send('伺服器錯誤，請稍後再試');
})


var port = process.env.PORT || 8080;
app.listen(port);