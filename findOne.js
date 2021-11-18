var MongoClient = require('mongodb').MongoClient; 
var url = "mongodb://localhost:27017/"; 
 
MongoClient.connect(url, function(err, db) { 
  if (err) throw err; 
  var dbo = db.db("proyectfinal"); 
  dbo.collection("users").findOne({}).toArray(function(err, result) { 
    if (err) throw err; 
    console.log(result); 
    console.log("contactos encontrados");
    db.close(); 
  }); 
}); 