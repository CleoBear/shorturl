"use strict";

require('dotenv').config();

var _RegExp;

exports.isUrl = function isUrl(url) {
    _RegExp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
    if(_RegExp.test(url)){
        return true;
    }else{
        return false;
    }
};

exports.isMyShortUrl = function isMyShortUrl(url){
    _RegExp = new RegExp(process.env.APP_URL);

    if(url.match(_RegExp)!== null){
        return true;
    }else{
        return false;
    }
};