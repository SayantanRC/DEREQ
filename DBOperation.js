
const Joi = require('joi');
const MongoConnector = require('./MongoConnector');
const mongoConnector = new MongoConnector.MongoConnector();

const ACTION_DB_OPEN = "DB_OPEN";
const ACTION_QUERY_COMPLETE = "DB_QUERY_COMPLETE";
const ACTION_DEVICE_CREATE = "DB_DEVICE_CREATE";
const ACTION_DEVICE_UPDATE = "DB_DEVICE_UPDATE";
const ACTION_DEVICE_DELETE = "DB_DEVICE_DELETE";
const ACTION_UNIT_CREATE = "DB_UNIT_CREATE";
const ACTION_UNIT_UPDATE = "DB_UNIT_UPDATE";
const ACTION_UNIT_DELETE = "DB_UNIT_DELETE";

const RESULT_OK = "RESULT_OK";
const RESULT_ERROR = "RESULT_ERROR";
const RESULT_BAD_DATA = "RESULT_BAD_DATA";
const RESULT_NO_SUCH_DEVICE = "RESULT_NO_SUCH_DEVICE";
const RESULT_DUPLICATE_ID = "RESULT_DUPLICATE_ID";

const COLLECTION_NAME_DEVICE = "device_collection";
const COLLECTION_NAME_UNIT = "unit_collection";
const COLLECTION_NAME_EMPLOYEE = "employee_collection";

const KEY_DEVICE_ID = "DeviceID";
const KEY_DEVICE_NAME = "DeviceName";

const KEY_UNIT_ID = "UnitID";
const KEY_EMPLOYEE_REGISTRATION_ID = "EmployeeRegistrationID";

const KEY_EMPLOYEE_ID = "EmployeeID";
const KEY_EMPLOYEE_NAME = "EmployeeName";
const KEY_EMPLOYEE_MOBILE = "MobileNo";
const KEY_EMPLOYEE_EMAIL = "Email";
const KEY_EMPLOYEE_ISACTIVE = "IsActive";
const KEY_EMPLOYEE_PASSWD = "Password";
const KEY_EMPLOYEE_TOKEN = "token";

class DBOperation {

    constructor(port, url, DBname) {
        this.url = url;
        this.port = port;
        this.DBName = DBname;
        this.DBUrl = `mongodb://${this.url}:${this.port}/`;
    }

    queryDB(collectionName, jsonQuery, callback) {
        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            if (db) {
                db.db(this.DBName).collection(collectionName).find(jsonQuery).toArray((err, res) => {
                    if (err) {
                        db.close();
                        callback(ACTION_QUERY_COMPLETE, {"result": RESULT_ERROR, "response": err});
                    }
                    else if (res.length === 0) {
                        db.close();
                        callback(ACTION_QUERY_COMPLETE, {
                            "result": RESULT_NO_SUCH_DEVICE,
                            "response": "No device with query params: " + JSON.stringify(jsonQuery)
                        });
                    }
                    else {
                        db.close();
                        callback(ACTION_QUERY_COMPLETE, {"result": RESULT_OK, "response": res});
                    }
                });
            }
        });

    }

    addToDB(jsonData, requiredSchema, ifAllowUnknown, collectionName, uniqueIDName, actionName, callback){

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            if (db) {

                let uDID = {}, uUID = {};
                uDID[KEY_DEVICE_ID] = 1;
                uUID[KEY_UNIT_ID] = 1;
                db.db(this.DBName).collection(COLLECTION_NAME_DEVICE).createIndex(uDID, {unique: true});
                db.db(this.DBName).collection(COLLECTION_NAME_UNIT).createIndex(uUID, {unique: true});

                const result = Joi.validate(jsonData, requiredSchema, {allowUnknown: ifAllowUnknown});
                if (result.error) callback(actionName, {"result": RESULT_BAD_DATA, "response": result.error});
                else {
                    let search_item = {};
                    search_item[uniqueIDName] = jsonData[uniqueIDName];
                    db.db(this.DBName).collection(collectionName).find(search_item).toArray((err, res) => {
                        if (err) {
                            db.close();
                            callback(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Duplicate validation error: " + err
                            });
                        }
                        else if (res.length !== 0) {
                            db.close();
                            callback(actionName, {
                                "result": RESULT_DUPLICATE_ID,
                                "response": `${uniqueIDName}: ${jsonData[uniqueIDName]}`
                            });
                        }
                        else {
                            db.db(this.DBName).collection(collectionName).insert(jsonData, (err, res) => {
                                db.close();
                                if (err) {
                                    callback(actionName, {
                                        "result": RESULT_ERROR,
                                        "response": "Insert error: " + err
                                    });
                                }
                                else {
                                    callback(actionName, {"result": RESULT_OK, "response": res})
                                }
                            })
                        }
                    });
                }
            }
        });

    }

    updateDB(jsonData, requiredSchema, ifAllowUnknown, collectionName, uniqueIDName, actionName, callback){

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            if (db) {
                const result = Joi.validate(jsonData, requiredSchema, {allowUnknown: ifAllowUnknown});
                if (result.error) callback(actionName, {"result": RESULT_BAD_DATA, "response": result.error});
                else {
                    let search_item = {};
                    search_item[uniqueIDName] = jsonData[uniqueIDName];
                    db.db(this.DBName).collection(collectionName).find(search_item).toArray((err, res) => {
                        if (err) {
                            db.close();
                            callback(actionName, {"result": RESULT_ERROR, "response": "Validation error: " + err});
                        }
                        else if (res.length !== 0) {
                            let combined_doc = res[0];
                            for (let key1 in jsonData) {
                                combined_doc[key1] = jsonData[key1];
                            }
                            let updated_doc = {};
                            for (let key2 in combined_doc) {
                                if (combined_doc[key2])
                                    updated_doc[key2] = combined_doc[key2];
                            }
                            db.db(this.DBName).collection(collectionName).update(search_item, updated_doc, (err, res) => {
                                db.close();
                                if (err) {
                                    callback(actionName, {
                                        "result": RESULT_ERROR,
                                        "response": "Update error: " + err
                                    });
                                }
                                else callback(actionName, {"result": RESULT_OK, "response": res});
                            })
                        }
                        else {
                            db.close();
                            callback(actionName, {
                                "result": RESULT_NO_SUCH_DEVICE,
                                "response": `${uniqueIDName} : ${jsonData[uniqueIDName]}`
                            });
                        }
                    });
                }
            }
        });


    }

    deleteFromDB(jsonData, requiredSchema, collectionName, uniqueIDName, actionName, callback){

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            if (db) {
                const result = Joi.validate(jsonData, requiredSchema);
                if (result.error) callback(actionName, {"result": RESULT_BAD_DATA, "response": result.error});
                else {
                    let search_item = {};
                    search_item[uniqueIDName] = jsonData[uniqueIDName];
                    db.db(this.DBName).collection(collectionName).find(search_item).toArray((err, res) => {
                        if (err) {
                            db.close();
                            callback(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Validation error: " + err
                            });
                        }
                        else if (res.length !== 0) {
                            db.db(this.DBName).collection(collectionName).remove(search_item, (err, res) => {
                                db.close();
                                if (err) callback(actionName, {
                                    "result": RESULT_ERROR,
                                    "response": "Deletion error: " + err
                                });
                                else callback(actionName, {"result": RESULT_OK, "response": res});
                            });
                        }
                        else {
                            db.close();
                            callback(actionName, {
                                "result": RESULT_NO_SUCH_DEVICE,
                                "response": `${uniqueIDName} : ${jsonData[uniqueIDName]}`
                            });
                        }
                    });
                }
            }
        });

    }

    addDevice(jsonDeviceData, callback) {

        let requiredSchema = {};
        requiredSchema[KEY_DEVICE_NAME] = Joi.string().min(3).required();
        requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();

        this.addToDB(jsonDeviceData, requiredSchema, true, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_CREATE, callback);
    }

    updateDevice(jsonData, callback) {
        const requiredSchema = {};
        requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();
        requiredSchema[KEY_DEVICE_NAME] = Joi.string().min(3);

        this.updateDB(jsonData, requiredSchema, true, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_UPDATE, callback);
    }

    deleteDevice(jsonData, callback) {
        const requiredSchema = {};
        requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();

        this.deleteFromDB(jsonData, requiredSchema, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_DELETE, callback);
    }

    addUnit(jsonUnitData, callback) {

        let search_item = {};
        let id = jsonUnitData[KEY_DEVICE_ID];
        if (id) search_item[KEY_DEVICE_ID] = id;
        this.queryDB(COLLECTION_NAME_DEVICE, search_item, (request, response) => {
            if (response.result === RESULT_OK){
                let requiredSchema = {};
                requiredSchema[KEY_UNIT_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.string().required();
                this.addToDB(jsonUnitData, requiredSchema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_CREATE, callback);
            }
            else {
                callback(ACTION_UNIT_CREATE, response)
            }

        });
    }

    updateUnit(jsonUnitData, callback){
        let search_item = {};
        let dID = jsonUnitData[KEY_DEVICE_ID];
        if (dID) search_item[KEY_DEVICE_ID] = dID;
        this.queryDB(COLLECTION_NAME_DEVICE, search_item, (request, response) => {

            if (response.result === RESULT_OK){
                let requiredSchema = {};
                requiredSchema[KEY_UNIT_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3);
                requiredSchema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.string();
                this.updateDB(jsonUnitData, requiredSchema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_UPDATE, callback);
            }
            else {
                callback(ACTION_UNIT_UPDATE, response)
            }

        });
    }

    deleteUnit(jsonData, callback){
        const requiredSchema = {};
        requiredSchema[KEY_UNIT_ID] = Joi.string().min(3).required();

        this.deleteFromDB(jsonData, requiredSchema, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_DELETE, callback);
    }

}

module.exports.DBOperationClass = DBOperation;

module.exports.ACTION_DB_OPEN = ACTION_DB_OPEN;
module.exports.ACTION_QUERY_COMPLETE = ACTION_QUERY_COMPLETE;
module.exports.ACTION_DEVICE_CREATE = ACTION_DEVICE_CREATE;
module.exports.ACTION_DEVICE_UPDATE = ACTION_DEVICE_UPDATE;
module.exports.ACTION_DEVICE_DELETE = ACTION_DEVICE_DELETE;
module.exports.ACTION_UNIT_CREATE = ACTION_UNIT_CREATE;
module.exports.ACTION_UNIT_UPDATE = ACTION_UNIT_UPDATE;
module.exports.ACTION_UNIT_DELETE = ACTION_UNIT_DELETE;

module.exports.RESULT_OK = RESULT_OK;
module.exports.RESULT_ERROR = RESULT_ERROR;
module.exports.RESULT_BAD_DATA = RESULT_BAD_DATA;
module.exports.RESULT_NO_SUCH_DEVICE = RESULT_NO_SUCH_DEVICE;
module.exports.RESULT_DUPLICATE_ID = RESULT_DUPLICATE_ID;

module.exports.COLLECTION_NAME_DEVICE = COLLECTION_NAME_DEVICE;
module.exports.COLLECTION_NAME_UNIT = COLLECTION_NAME_UNIT;
module.exports.COLLECTION_NAME_EMPLOYEE = COLLECTION_NAME_EMPLOYEE;