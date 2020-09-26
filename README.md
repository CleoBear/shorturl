# shorturl
This short URL api service, implement by node.js, Mysql, redis database.

## System Requirement

* [Node.JS](https://nodejs.org/en/)
* [npm](https://www.npmjs.com/)
* [MySql](https://www.mysql.com/)
* [redis](https://redis.io/)
* [git](https://git-scm.com/)
  
## Installation

Download this project from gitHub web side or just use git command to clone this project.
```cmd
$ git clone https://github.com/CleoBear/shorturl.git
```
Use npm package managment to install packages for needs.
the settings could be configure in package.json file in this project.

```cmd
$ npm install
```
Start server
```cmd
$ npm start
```
View the website at: http://localhost:3000

## Environment Configuration
To set environment variabes, please modify .env file, you could cpoy from .env.example and configure .env file

```cmd
$ cp .env.example .env 
```
## MySQL Database Structure

```mysql
CREATE TABLE `url_map` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `short_url` varchar(100) NOT NULL DEFAULT '' COMMENT 'short URL',
  `long_url` text NOT NULL COMMENT 'original URL',
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_url` (`short_url`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8;
```

## API interface

To make Short URL

```cmd
curl -H "Content-Type:application/json" -X POST -d '{"url": "https://github.com/CleoBear/shorturl"}' http://localhost:3000/generate
```
You will get the response like this
```json
{"code":"1","content":"http://localhost:3000/1Km6F2","msg":"success"}
```
Use this command you will get a Redirecting to https://github.com/CleoBear/shorturl

```cmd
curl http://localhost:3000/1Km6F2
```
## Live Demo

I had puted this prject to [Heroku](https://dashboard.heroku.com/) server, you could test follow this hint.

```cmd
curl -H "Content-Type:application/json" -X POST -d '{"url": "https://github.com/CleoBear/shorturl"}' https://short-url-cc.herokuapp.com/generate
```