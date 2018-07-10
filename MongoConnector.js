
//dependencies
const mongoClient = require('mongodb').MongoClient;
const DBOperation = require('./DBOperation');

class MongoConnector {

    //connect to mongo db using mongo db client
    onMongoConnect(url, parentCallback, DBOpCallback){

        //parentCallback -> goes directly to the http response
        //DBOpCallback -> goes to the function which requested connection to the database

        mongoClient.connect(url, (err, db) => {

            //after connection is complete

            if (err) {

                //in case of error
                //directly send error to http response
                if (parentCallback)
                parentCallback(DBOperation.ACTION_DB_OPEN, {"result": DBOperation.RESULT_ERROR, "response": err.toString()});
            }
            else {

                //if connection is successful
                //send the database object
                DBOpCallback(db);
            }
        })
    }
}

//export the MongoConnector class
module.exports.MongoConnector = MongoConnector;