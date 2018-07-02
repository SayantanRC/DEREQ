const DBOperation = require('./DBOperation');
const COLLECTION_NAME_LOG = "logs";
const MongoConnector = require('./MongoConnector');
const mongoConnector = new MongoConnector.MongoConnector();

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
        this.DBName = DBName;
        this.DBUrl = DBUrl;
    }
    
    pushToLog(action, collectionName, jsonInput, callback){

        let log_entry = {};
        log_entry[KEY_ACTION] = action;
        log_entry[KEY_COLLECTION_NAME] = collectionName;
        log_entry[KEY_INPUT_DATA] = jsonInput;

        let date = new Date();

        log_entry[KEY_DATE] = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate();
        log_entry[KEY_TIME] = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        log_entry[KEY_TIMESTAMP] = log_entry[KEY_DATE] + " " + log_entry[KEY_TIME];

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            db.db(this.DBName).collection(COLLECTION_NAME_LOG).insert(log_entry, (err, res) => {
                db.close();
                if (callback){
                    if (err)
                        callback(ACTION_PUSH_TO_LOG, {"result" : DBOperation.RESULT_ERROR, "response" : err});
                    else
                        callback(ACTION_PUSH_TO_LOG, {"result" : DBOperation.RESULT_OK, "response" : res});
                }
            })
        });
        
    }

    pushUnitTransaction(action, eid, uid, callback){

        let log_entry = {};
        log_entry[KEY_ACTION] = action;
        log_entry[KEY_COLLECTION_NAME] = DBOperation.COLLECTION_NAME_UNIT;
        log_entry[DBOperation.KEY_EMPLOYEE_REGISTRATION_ID] = eid;
        log_entry[DBOperation.KEY_UNIT_ID] = uid;

        let date = new Date();

        log_entry[KEY_DATE] = date.getFullYear() + "/" + (date.getMonth()+1) + "/" + date.getDate();
        log_entry[KEY_TIME] = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        log_entry[KEY_TIMESTAMP] = log_entry[KEY_DATE] + " " + log_entry[KEY_TIME];

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            db.db(this.DBName).collection(COLLECTION_NAME_LOG).insert(log_entry, (err, res) => {
                db.close();
                if (callback){
                    if (err)
                        callback(ACTION_UNIT_TRANS_LOG, {"result" : DBOperation.RESULT_ERROR, "response" : err});
                    else
                        callback(ACTION_UNIT_TRANS_LOG, {"result" : DBOperation.RESULT_OK, "response" : res});
                }
            })
        });

    }

    clearLog(callback){

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            db.db(this.DBName).collection(COLLECTION_NAME_LOG).drop((err, res) => {
                console.log(err);
                console.log(res);
                this.pushToLog(ACTION_CLEAR_LOG, COLLECTION_NAME_LOG, {}, null);
                db.close();
                if (err)
                    callback(ACTION_CLEAR_LOG, {"result" : DBOperation.RESULT_ERROR, "response" : err});
                else
                    callback(ACTION_CLEAR_LOG, {"result" : DBOperation.RESULT_OK, "response" : res});
            });
        });

    }

    getLog(jsonQuery, callback){

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {

            db.db(this.DBName).collection(COLLECTION_NAME_LOG).find(jsonQuery).toArray((err, res) => {
                db.close();
                if (err) {
                    callback(ACTION_QUERY_LOG, {"result": DBOperation.RESULT_ERROR, "response": err});
                }
                else if (res.length === 0) {
                    callback(ACTION_QUERY_LOG, {
                        "result": DBOperation.RESULT_NO_SUCH_DATA,
                        "response": "No log with query params: " + JSON.stringify(jsonQuery)
                    });
                }
                else {
                    callback(ACTION_QUERY_LOG, {"result": DBOperation.RESULT_OK, "response": res});
                }
            })

        })

    }

}

module.exports.Logger = Logger;