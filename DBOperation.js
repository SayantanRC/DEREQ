const mongoClient = require('mongodb').MongoClient;
const EventEmitter = require('events');
const Joi = require('joi');

const ACTION_DB_OPENED = "DB_OPENED";
const ACTION_DB_CLOSED = "DB_CLOSED";
const ACTION_QUERY_COMPLETE = "DB_QUERY_COMPLETE";
const ACTION_DEVICE_CREATE = "DB_DEVICE_CREATE";
const ACTION_DEVICE_UPDATE = "DB_DEVICE_UPDATE";
const ACTION_DEVICE_DELETE = "DB_DEVICE_DELETE";
const ACTION_UNIT_CREATE = "DB_UNIT_CREATE";
const ACTION_UNIT_UPDATE = "DB_UNIT_UPDATE";
const ACTION_UNIT_DELETE = "DB_UNIT_DELETE";

const RESULT_YES = "RESULT_YES";
const RESULT_ERROR = "RESULT_ERROR";
const RESULT_NO = "RESULT_NO";
const RESULT_BAD_DATA = "RESULT_BAD_DATA";
const RESULT_NO_SUCH_DEVICE = "RESULT_NO_SUCH_DEVICE";
const RESULT_DUPLICATE_ID = "RESULT_DUPLICATE_ID";

const COLLECTION_NAME_DEVICE = "device_collection";
const COLLECTION_NAME_UNIT = "unit_collection";

const KEY_DEVICE_ID = "DeviceID";
const KEY_DEVICE_NAME = "DeviceName";
const KEY_UNIT_ID = "UnitID";
const KEY_EMPLOYEE_REGISTRATION_ID = "EmployeeRegistrationID";

class DBOperation extends EventEmitter {

    init(port, url, DBname) {
        this.url = url;
        this.port = port;
        this.DBName = DBname;
        this.DBUrl = `mongodb://${this.url}:${this.port}/`;
        this.openDB()
    }

    openDB() {
        if (!this.DBMain) {
            mongoClient.connect(this.DBUrl, (err, DB) => {
                if (err) {
                    this.emit(ACTION_DB_OPENED, {"result": RESULT_ERROR, "response": err});
                }
                else {
                    this.DBMain = DB;
                    let uDID = {}, uUID = {};
                    uDID[KEY_DEVICE_ID] = 1;
                    uUID[KEY_UNIT_ID] = 1;
                    this.DBMain.db(this.DBName).collection(COLLECTION_NAME_DEVICE).createIndex(uDID, {unique: true});
                    this.DBMain.db(this.DBName).collection(COLLECTION_NAME_UNIT).createIndex(uUID, {unique: true});
                    this.emit(ACTION_DB_OPENED, {"result": RESULT_YES, "response": this.DBUrl});
                }
            })
        }
        else this.emit(ACTION_DB_OPENED, {"result": RESULT_NO, "response": this.DBUrl});
    }

    closeDB() {
        if (this.DBMain) {
            this.DBMain.close(() => {
                this.emit(ACTION_DB_CLOSED, {"result": RESULT_YES});
                this.DBMain = undefined;
            });
        }
        else this.emit(ACTION_DB_CLOSED, {"result": RESULT_NO});
    }

    queryDB(collectionName, jsonQueryString, onReturn, doReturn) {
        if (this.DBMain) {
            try {
                let queryObject = JSON.parse(jsonQueryString);
                this.DBMain.db(this.DBName).collection(collectionName).find(queryObject).toArray((err, res) => {
                    if (err) {
                        if (onReturn) onReturn({"result": RESULT_ERROR, "response": err});
                        else this.emit(ACTION_QUERY_COMPLETE, {"result": RESULT_ERROR, "response": err});
                    }
                    else if (res.length === 0) {
                        if (onReturn) onReturn (RESULT_NO_SUCH_DEVICE);
                        else this.emit(ACTION_QUERY_COMPLETE, {
                            "result": RESULT_NO_SUCH_DEVICE,
                            "response": "No device with query params: " + JSON.stringify(jsonQueryString)
                        });
                    }
                    else {
                        if (onReturn) onReturn (RESULT_YES);
                        else this.emit(ACTION_QUERY_COMPLETE, {"result": RESULT_YES, "response": res});
                    }
                });
            }
            catch (e) {
                if (onReturn) onReturn({"result" : RESULT_BAD_DATA, "response" : e});
                else this.emit(ACTION_QUERY_COMPLETE, {
                    "result": RESULT_BAD_DATA,
                    "response": "Error: " + e + "\nProvided data: " + jsonQueryString
                });
            }
        }
        else {
            if (doReturn) onReturn(RESULT_NO);
            this.emit(ACTION_QUERY_COMPLETE, {"result": RESULT_NO});
        }
    }

    addToDB(jsonData, requiredSchema, ifAllowUnknown, collectionName, uniqueIDName, actionName){
        if (this.DBMain) {
            const result = Joi.validate(jsonData, requiredSchema, {allowUnknown: ifAllowUnknown});
            if (result.error) this.emit(actionName, {"result": RESULT_BAD_DATA, "response": result.error});
            else {
                let search_item = {};
                search_item[uniqueIDName] = jsonData[uniqueIDName];
                this.DBMain.db(this.DBName).collection(collectionName).find(search_item).toArray((err, res) => {
                    if (err) {
                        this.emit(actionName, {
                            "result": RESULT_ERROR,
                            "response": "Duplicate validation error: " + err
                        });
                    }
                    else if (res.length !== 0) {
                        this.emit(actionName, {
                            "result": RESULT_DUPLICATE_ID,
                            "response": `${uniqueIDName}: ${jsonData[uniqueIDName]}`
                        });
                    }
                    else {
                        this.DBMain.db(this.DBName).collection(collectionName).insert(jsonData, (err, res) => {
                            if (err) this.emit(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Insert error: " + err
                            });
                            else this.emit(actionName, {"result": RESULT_YES, "response": res})
                        })
                    }
                });
            }
        }
        else this.emit(actionName, {"result": RESULT_NO});
    }

    updateDB(jsonData, requiredSchema, ifAllowUnknown, collectionName, uniqueIDName, actionName){
        if (this.DBMain) {
            const result = Joi.validate(jsonData, requiredSchema, {allowUnknown: ifAllowUnknown});
            if (result.error) this.emit(actionName, {"result": RESULT_BAD_DATA, "response": result.error});
            else {
                let search_item = {};
                search_item[uniqueIDName] = jsonData[uniqueIDName];
                this.DBMain.db(this.DBName).collection(collectionName).find(search_item).toArray((err, res) => {
                    if (err) {
                        this.emit(actionName, {"result": RESULT_ERROR, "response": "Validation error: " + err});
                    }
                    else if (res.length !== 0) {
                        let updated_doc = res[0];
                        for (let key in jsonData) {
                            updated_doc[key] = jsonData[key];
                        }
                        this.DBMain.db(this.DBName).collection(collectionName).update(search_item, updated_doc, (err, res) => {
                            if (err) this.emit(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Update error: " + err
                            });
                            else this.emit(actionName, {"result": RESULT_YES, "response": res});
                        })
                    }
                    else {
                        this.emit(actionName, {
                            "result": RESULT_NO_SUCH_DEVICE,
                            "response": `${uniqueIDName} : ${jsonData[uniqueIDName]}`
                        });
                    }
                });
            }
        }
        else this.emit(actionName, {"result": RESULT_NO});
    }

    deleteFromDB(jsonData, requiredSchema, collectionName, uniqueIDName, actionName){
        if (this.DBMain) {
            const result = Joi.validate(jsonData, requiredSchema);
            if (result.error) this.emit(actionName, {"result": RESULT_BAD_DATA, "response": result.error});
            else {
                let search_item = {};
                search_item[uniqueIDName] = jsonData[uniqueIDName];
                this.DBMain.db(this.DBName).collection(collectionName).find(search_item).toArray((err, res) => {
                    if (err) {
                        this.emit(actionName, {
                            "result": RESULT_ERROR,
                            "response": "Validation error: " + err
                        });
                    }
                    else if (res.length !== 0) {
                        this.DBMain.db(this.DBName).collection(collectionName).remove(search_item, (err, res) => {
                            if (err) this.emit(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Deletion error: " + err
                            });
                            else this.emit(actionName, {"result": RESULT_YES, "response": res});
                        });
                    }
                    else {
                        this.emit(actionName, {
                            "result": RESULT_NO_SUCH_DEVICE,
                            "response": `${uniqueIDName} : ${jsonData[uniqueIDName]}`
                        });
                    }
                });
            }
        }
        else this.emit(actionName, {"result": RESULT_NO});
    }

    addDevice(jsonDeviceData) {

        let requiredSchema = {};
        requiredSchema[KEY_DEVICE_NAME] = Joi.string().min(5).required();
        requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();

        this.addToDB(jsonDeviceData, requiredSchema, true, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_CREATE);
    }

    updateDevice(jsonData) {
            const requiredSchema = {};
            requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();

            this.updateDB(jsonData, requiredSchema, true, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_UPDATE);
    }

    deleteDevice(jsonData) {
            const requiredSchema = {};
            requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();

            this.deleteFromDB(jsonData, requiredSchema, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_DELETE);
    }

    addUnit(jsonUnitData) {

        let search_item = {};
        search_item[KEY_DEVICE_ID] = jsonUnitData[KEY_DEVICE_ID];
        this.queryDB(COLLECTION_NAME_DEVICE, JSON.stringify(search_item), (r) => {

            if (r === RESULT_YES){
                let requiredSchema = {};
                requiredSchema[KEY_UNIT_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.string().required();
                this.addToDB(jsonUnitData, requiredSchema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_CREATE);
            }
            else if (r === RESULT_NO_SUCH_DEVICE) {
                this.emit(ACTION_UNIT_CREATE, {"result" : RESULT_NO_SUCH_DEVICE, "response" : `${KEY_DEVICE_ID} : ${search_item[KEY_DEVICE_ID]}`});
            }
            else if (r === RESULT_NO) {
                this.emit(ACTION_UNIT_CREATE, {"result" : RESULT_NO})
            }
            else {
                this.emit(ACTION_UNIT_CREATE, {"result": r.result, "response": r.response})
            }

        });
    }

    updateUnit(jsonUnitData){
        let search_item = {};
        search_item[KEY_DEVICE_ID] = jsonUnitData[KEY_DEVICE_ID];
        this.queryDB(COLLECTION_NAME_DEVICE, JSON.stringify(search_item), (r) => {

            if (r === RESULT_YES){
                let requiredSchema = {};
                requiredSchema[KEY_UNIT_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3);
                requiredSchema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.string();
                this.updateDB(jsonUnitData, requiredSchema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_UPDATE);
            }
            else if (r === RESULT_NO_SUCH_DEVICE) {
                this.emit(ACTION_UNIT_UPDATE, {"result" : RESULT_NO_SUCH_DEVICE, "response" : `${KEY_DEVICE_ID} : ${search_item[KEY_DEVICE_ID]}`});
            }
            else if (r === RESULT_NO) {
                this.emit(ACTION_UNIT_UPDATE, {"result" : RESULT_NO})
            }
            else {
                this.emit(ACTION_UNIT_UPDATE, {"result": r.result, "response": r.response})
            }

        });
    }

}

module.exports.DBOperationClass = DBOperation;

module.exports.ACTION_DB_OPENED = ACTION_DB_OPENED;
module.exports.ACTION_DB_CLOSED = ACTION_DB_CLOSED;
module.exports.ACTION_QUERY_COMPLETE = ACTION_QUERY_COMPLETE;
module.exports.ACTION_DEVICE_CREATE = ACTION_DEVICE_CREATE;
module.exports.ACTION_DEVICE_UPDATE = ACTION_DEVICE_UPDATE;
module.exports.ACTION_DEVICE_DELETE = ACTION_DEVICE_DELETE;
module.exports.ACTION_UNIT_CREATE = ACTION_UNIT_CREATE;
module.exports.ACTION_UNIT_UPDATE = ACTION_UNIT_UPDATE;
module.exports.ACTION_UNIT_DELETE = ACTION_UNIT_DELETE;

module.exports.RESULT_YES = RESULT_YES;
module.exports.RESULT_NO = RESULT_NO;
module.exports.RESULT_ERROR = RESULT_ERROR;
module.exports.RESULT_BAD_DATA = RESULT_BAD_DATA;
module.exports.RESULT_NO_SUCH_DEVICE = RESULT_NO_SUCH_DEVICE;
module.exports.RESULT_DUPLICATE_ID = RESULT_DUPLICATE_ID;

module.exports.COLLECTION_NAME_DEVICE = COLLECTION_NAME_DEVICE;
module.exports.COLLECTION_NAME_UNIT = COLLECTION_NAME_UNIT;