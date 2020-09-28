const pool = require("../connections/mysql");
const base62 = require("base62/lib/ascii");


var _query = function (sql, values) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            if (err) {
                reject(err);
            } else {
                connection.query(sql, values, (err, rows) => {
                    if (err) {
                        reject(err);
                    } else {
                        console.log(values);
                        let data = (JSON.parse(JSON.stringify(rows)));
                        resolve(data);
                    }
                    connection.release();
                });
            }
        });
    });
};

exports.getLongUrl = function getLongUrl(shortId) {
    
    let sql = 'SELECT long_url FROM url_map WHERE short_url = ?';
    return _query(sql, shortId);
        
};

exports.getShortId = function getShortId(longUrl) {

    let sql = 'SELECT short_url FROM url_map WHERE long_url = ?';
    return _query(sql, longUrl);
    
};

exports.newShortId = function newShortId(longUrl) {
    
    return new Promise((resolve, reject) => {
        pool.getConnection(function (error, connection) {
            //產生新的對應關係
            connection.beginTransaction(function (error) {
                if (error) {
                    connection.rollback(function () {
                        connection.release();
                        reject(error);
                    });
                }
                let insertSql = 'INSERT INTO url_map SET long_url=?';
                connection.query(insertSql, longUrl, function (error, results, fields) {
                    if (error) {
                        connection.rollback(function () {
                            connection.release();
                            reject(error);
                        });
                    }
                    let id = results.insertId;
                    let shortId = base62.encode(results.insertId + Math.floor(new Date() / 1000));
                    let updateSql = 'UPDATE url_map SET short_url=? WHERE id = ?';
                    connection.query(updateSql, [shortId, id], function (error, results, fields) {

                        if (error) {
                            connection.rollback(function () {
                                connection.release();
                                reject(error);
                            });
                        }

                        connection.commit(function (error) {
                            if (error) {
                                connection.rollback(function () {
                                    connection.release();
                                    reject(error);
                                });
                            } else {
                                connection.release();
                                resolve(shortId)
                            }
                        });
                    });
                });
            });
        });
    });
};