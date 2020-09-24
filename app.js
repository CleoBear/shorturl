const db = require("./connections/firebase_admin")
const express = require("express");
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const jsonParser = bodyParser.json();
const ref = db.ref();

app.post('/shorturl', jsonParser, function(req, res){

    let urlRef = ref.child("urls");
    let longUrl = req.body.url;
    urlRef.push(longUrl).then((snapshot)=>{
        shortUrl = process.env.APP_URL + ':' + process.env.PORT + '/' + snapshot.key;;
        res.status(200).json({code:'1', content:shortUrl, msg:'success'});
    });

})

app.get('/:shortId', function(req, res){

    let urlRef = ref.child("urls/" + req.params.shortId);
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