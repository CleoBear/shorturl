const mysql = require("mysql");
require('dotenv').config();

var pool=mysql.createPool({
    host     : process.env.MYSQL_HOST,
    user     : process.env.MYSQL_USER,
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DATABASE,
    // 最大連線數，預設為10
    connectionLimit: 10,
});

module.exports = pool;