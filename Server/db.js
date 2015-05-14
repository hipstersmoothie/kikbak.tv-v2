var databaseURI = "mongodb://server:hushmon3y@ds039950.mongolab.com:39950/wondervid";
var collections = ["videos", "blogs"];
var db = require("mongojs").connect(databaseURI, collections);


module.exports = db;