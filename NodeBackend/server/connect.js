const { MongoClient } = require('mongodb');

const url = process.env.MONGO_DB_URL || "mongodb://localhost:27017/";
const dbname = "firstnativeproject";
const _MongoClient = new MongoClient(url,
  {
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 2000
  });

exports.connect = (callback) => {
  var db;
  _MongoClient.connect(function (err) {
    if (err) {
      console.log(new Date() + ' Unable to connect to mongo server');
      throw err;
    }
    console.log(new Date() + ' Connected to mongo server');
    db = _MongoClient.db(dbname);
    callback(db);
  });
}

exports.close = function () {
  _MongoClient.close(true, function (err) {
    if (err) {
      console.log('unable to close connection to mongo');
      return;
    }
    console.log('closed connection');
  });
}
