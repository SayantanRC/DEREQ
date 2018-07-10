
//dependencies
const DBOperation = require('./DBOperation');
const COLLECTION_NAME_LOG = "logs";
const MongoConnector = require('./MongoConnector');     //uses the MongoConnector.js to connect to the database
const mongoConnector = new MongoConnector.MongoConnector();

//constants
const ACTION_CLEAR_LOG = "CLEAR_LOG";
const ACTION_PUSH_TO_LOG = "PUSH_TO_LOG";
const ACTION_UNIT_TRANS_LOG = "TRANSACTION_LOG";
const ACTION_QUERY_LOG = "QUERY_LOG";

const KEY_ACTION = "Action";
const KEY_COLLECTION_NAME = "CollectionName";
const KEY_INPUT_DATA = "InputJsonData";
const KEY_DATE = "Date";
const KEY_TIME = "Time";
const KEY_TIMESTAMP = "Timestamp(YYYY/MM/DD hh:mm:ss)";

class Logger {

    constructor(DBName, DBUrl){

        //constructor that initialises database name and database url
        this.DBName = DBName;
        this.DBUrl = DBUrl;
    }
    
    pushToLog(action, collectionName, jsonInput, empID, callback){

        //this is the generic method which pushes information to the log
        //this method is used except for issuing and submitting units

        let log_entry = {};     //json entry to push in the log

        //the action performed
        log_entry[KEY_ACTION] = action;

        //collection on which operation is being performed
        log_entry[KEY_COLLECTION_NAME] = collectionName;

        //json input data passed in request body
        log_entry[KEY_INPUT_DATA] = jsonInput;

        //employee id who is performing the operation
        if (empID !== null || empID !== undefined)
        log_entry[DBOperation.KEY_EMPLOYEE_ID] = empID;

        //date object to extract the body
        let date = new Date();

        log_entry[KEY_DATE] = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate();        //get the date
        log_entry[KEY_TIME] = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();          //get the time
        log_entry[KEY_TIMESTAMP] = log_entry[KEY_DATE] + " " + log_entry[KEY_TIME];                         //timestamp = date + time

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {

            //after connecting to mongo db using MongoConnector
            //push the data in the log
            db.db(this.DBName).collection(COLLECTION_NAME_LOG).insert(log_entry, (err, res) => {

                //close the db after operation
                db.close();

                //if a callback function is present
                //send the error or response
                if (callback){
                    if (err)
                        callback(ACTION_PUSH_TO_LOG, {"result" : DBOperation.RESULT_ERROR, "response" : err});
                    else
                        callback(ACTION_PUSH_TO_LOG, {"result" : DBOperation.RESULT_OK, "response" : res});
                }
            })
        });
        
    }

    pushUnitTransaction(action, eid, uid, empID, callback){

        //this method is used for issuing and submitting units

        let log_entry = {};     //json entry to push in the log

        //action performed: ISSUE_UNIT or SUBMIT_UNIT
        log_entry[KEY_ACTION] = action;

        //collection is the unit_collection on which operation is performed
        log_entry[KEY_COLLECTION_NAME] = DBOperation.COLLECTION_NAME_UNIT;

        //set the employee registration id for the unit
        log_entry[DBOperation.KEY_EMPLOYEE_REGISTRATION_ID] = eid;

        //set the employee id of the employee who is performing the operation
        log_entry[DBOperation.KEY_UNIT_ID] = uid;
        if (empID !== null || empID !== undefined)
            log_entry[DBOperation.KEY_EMPLOYEE_ID] = empID;

        //make a date object
        let date = new Date();

        log_entry[KEY_DATE] = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate();        //get the date
        log_entry[KEY_TIME] = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();          //get the time
        log_entry[KEY_TIMESTAMP] = log_entry[KEY_DATE] + " " + log_entry[KEY_TIME];                         //timestamp = date + time

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {

            //connected to mongo db
            db.db(this.DBName).collection(COLLECTION_NAME_LOG).insert(log_entry, (err, res) => {

                //close the database as operation is complete
                db.close();

                //if a callback function is present
                //send the error or response
                if (callback){
                    if (err)
                        callback(ACTION_UNIT_TRANS_LOG, {"result" : DBOperation.RESULT_ERROR, "response" : err});
                    else
                        callback(ACTION_UNIT_TRANS_LOG, {"result" : DBOperation.RESULT_OK, "response" : res});
                }
            })
        });

    }

    clearLog(callback, empID){

        //this function deletes the log collection
        //then creates also creates an entry with action = CLEAR_LOG

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {

            //connected to database

            db.db(this.DBName).collection(COLLECTION_NAME_LOG).drop((err, res) => {

                //the logs collection is deleted

                //push an entry that the log was cleared
                this.pushToLog(ACTION_CLEAR_LOG, COLLECTION_NAME_LOG, {}, empID);
                db.close();

                //if a callback function is present
                //send the error or response
                if (err)
                    callback(ACTION_CLEAR_LOG, {"result" : DBOperation.RESULT_ERROR, "response" : err});
                else
                    callback(ACTION_CLEAR_LOG, {"result" : DBOperation.RESULT_OK, "response" : res});
            });
        });

    }

    getLog(jsonQuery, callback){

        //this function returns the logs
        //it can also query on a given json body

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {

            db.db(this.DBName).collection(COLLECTION_NAME_LOG).find(jsonQuery).toArray((err, res) => {

                //on query complete of database...
                db.close();

                if (err) {
                    //error, send error
                    callback(ACTION_QUERY_LOG, {"result": DBOperation.RESULT_ERROR, "response": err});
                }
                else if (res.length === 0) {

                    //response has zero length i.e. no data

                    callback(ACTION_QUERY_LOG, {
                        "result": DBOperation.RESULT_NO_SUCH_DATA,
                        "response": "No log with query params: " + JSON.stringify(jsonQuery)
                    });

                }
                else {

                    //only option left is RESULT_OK
                    callback(ACTION_QUERY_LOG, {"result": DBOperation.RESULT_OK, "response": res});
                }
            })

        })

    }

}

//export the Logger class
module.exports.Logger = Logger;