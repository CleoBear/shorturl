const pool = require("../connections/mysql");
const base62 = require("base62/lib/ascii");

exports.getLongUrl = function getLongUrl(shortId) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (error, connection) {
            if (error) {
                reject(error);
            };

            let sql = 'SELECT long_url FROM url_map WHERE short_url = ?';

            connection.query(sql, shortId, function (error, results, fields) {
                connection.release();
                if (error) {
                    reject(error);
                };
                let data = (JSON.parse(JSON.stringify(results)));
                if (data.length > 0) {
                    resolve(data[0].long_url);
                } else {
                    resolve(null);
                }
            });
        });
    });
};

exports.getShortId = function getShortId(longUrl) {
    return new Promise((resolve, reject) => {
        pool.getConnection(function (error, connection) {
            if (error) {
                reject(error);
            };

            let sql = 'SELECT short_url FROM url_map WHERE long_url = ?';

            connection.query(sql, longUrl, function (error, results, fields) {
                connection.release();
                if (error) {
                    reject(error);
                };
                let data = (JSON.parse(JSON.stringify(results)));
                if (data.length > 0) {
                    resolve(data[0].short_url);
                } else {
                    resolve(null);
                }
            });
        });
    });
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