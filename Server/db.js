var databaseURI = "localhost:27017/videos";
var collections = ["videos", "blogs"];
var db = require("mongojs").connect(databaseURI, collections);


module.exports = db;