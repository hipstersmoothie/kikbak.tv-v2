var databaseURI = "mongodb://server:hushmon3y@ds039950.mongolab.com:39950/wondervid";
var collections = ["videos", "blogs"];
var mongojs = require('mongojs')
var db = mongojs(databaseURI, collections, { authMechanism : 'ScramSHA1' })

module.exports = db;