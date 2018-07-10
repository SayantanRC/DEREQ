
//dependencies
const Joi = require('joi');
const MongoConnector = require('./MongoConnector');
const mongoConnector = new MongoConnector.MongoConnector();
const Logger = require('./Logger');
const bcryptjs = require('bcryptjs');

//constants

//actions or requests
const ACTION_DB_OPEN = "DB_OPEN";
const ACTION_QUERY_COMPLETE = "DB_QUERY_COMPLETE";
const ACTION_DEVICE_CREATE = "DB_DEVICE_CREATE";
const ACTION_DEVICE_UPDATE = "DB_DEVICE_UPDATE";
const ACTION_DEVICE_DELETE = "DB_DEVICE_DELETE";
const ACTION_UNIT_CREATE = "DB_UNIT_CREATE";
const ACTION_UNIT_UPDATE = "DB_UNIT_UPDATE";
const ACTION_UNIT_DELETE = "DB_UNIT_DELETE";
const ACTION_EMPLOYEE_CREATE = "DB_EMPLOYEE_CREATE";
const ACTION_EMPLOYEE_UPDATE = "DB_EMPLOYEE_UPDATE";
const ACTION_EMPLOYEE_DELETE = "DB_EMPLOYEE_DELETE";
const ACTION_ISSUE_UNIT = "ISSUE_UNIT";
const ACTION_SUBMIT_UNIT = "SUBMIT_UNIT";

//results
const RESULT_OK = "RESULT_OK";
const RESULT_ERROR = "RESULT_ERROR";
const RESULT_BAD_DATA = "RESULT_BAD_DATA";
const RESULT_NO_SUCH_DATA = "RESULT_NO_SUCH_DATA";
const RESULT_DUPLICATE_ID = "RESULT_DUPLICATE_ID";

//collection names
const COLLECTION_NAME_DEVICE = "device_collection";
const COLLECTION_NAME_UNIT = "unit_collection";
const COLLECTION_NAME_EMPLOYEE = "employee_collection";

//json keys
const KEY_CHANGES = "changes";

//json keys for device
const KEY_DEVICE_ID = "DeviceID";
const KEY_DEVICE_TYPE = "DeviceType";
const KEY_DEVICE_NAME = "DeviceName";
const KEY_DEVICE_MAKE = "Make";
const KEY_DEVICE_MODEL = "Model";
const KEY_DEVICE_RAM = "RAM";
const KEY_DEVICE_STORAGE = "Storage";
const KEY_DEVICE_OS = "OS";
const KEY_DEVICE_OS_VERSION = "OSVersion";
const KEY_DEVICE_ACCESSORY = "Accessories";
const KEY_DEVICE_ACCESSORY_STATUS = "AccessoryAvailabilityStatus";
const KEY_DEVICE_COMMENTS = "Comments";

//json keys for unit
const KEY_UNIT_ID = "UnitID";
const KEY_EMPLOYEE_REGISTRATION_ID = "EmployeeRegistrationID";
const KEY_UNIT_CONDITION = "UnitCondition";

//json keys for employees
const KEY_EMPLOYEE_ID = "EmployeeID";
const KEY_EMPLOYEE_NAME = "EmployeeName";
const KEY_EMPLOYEE_MOBILE = "MobileNo";
const KEY_EMPLOYEE_EMAIL = "Email";
const KEY_EMPLOYEE_ISACTIVE = "IsActive";
const KEY_EMPLOYEE_ISADMIN = "IsAdmin";
const KEY_EMPLOYEE_PASSWD = "Password";

class DBOperation {

    constructor(port, url, DBname) {

        //constructor initialises the following parameters
        this.url = url;         //the mongo db connection url
        this.port = port;       //the mongo db port
        this.DBName = DBname;   //the database name
        this.DBUrl = `mongodb://${this.url}:${this.port}/`;     //make the full mongo db url

        //make a logger object, for logging
        this.logger = new Logger.Logger(DBname, this.DBUrl);
    }

    queryDB(collectionName, jsonQuery, callback, doLog, empID) {

        //the generic query method
        //performs query on all collections

        //collectionName -> the collection on which the query is performed
        //jsonQuery -> the query object
        //callback -> the function which is called after the query is completed
        //doLog -> if set to true, Logger will log the query
        //empID -> the employee who is querying

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {

            //getting the database object form mongo connector
            if (db) {

                //find the jsonQuery in the collection
                db.db(this.DBName).collection(collectionName).find(jsonQuery).toArray((err, res) => {

                    //operation complete, close the db
                    db.close();

                    if (err) {
                        //error
                        callback(ACTION_QUERY_COMPLETE, {"result": RESULT_ERROR, "response": err});
                    }
                    else if (res.length === 0) {

                        //response length is zero i.e. no data
                        callback(ACTION_QUERY_COMPLETE, {
                            "result": RESULT_NO_SUCH_DATA,
                            "response": "No data with query params: " + JSON.stringify(jsonQuery)
                        });
                    }
                    else {

                        //successful query

                        //log the query if needed
                        if (doLog === true){
                            this.logger.pushToLog(ACTION_QUERY_COMPLETE, collectionName, jsonQuery, empID)
                        }

                        //send the result
                        callback(ACTION_QUERY_COMPLETE, {"result": RESULT_OK, "response": res});
                    }
                });
            }
        });
    }

    addToDB(jsonData, requiredSchema, ifAllowUnknown, collectionName, uniqueIDName, actionName, callback, empID){

        //the generic method to add new document to a collection

        //jsonData -> the json object to be inserted
        //requiredSchema -> the schema to be enforced in the jsonData
        //ifAllowUnknown -> if set to true, any other keys are allowed in the jsonData not specified in requiredSchema
        //collectionName -> the collection on which the insertion is performed
        //uniqueIDName -> before insertion, checks for duplication of this field
        //                  Example: a "DeviceID" = "SG149" is already present
        //                  A new jsonData with "DeviceID" = "SG149" is not allowed
        //                  So the uniqueIDName = "DeviceID"
        //actionName -> the name of the action/request being performed
        //                  Example: "DB_DEVICE_CREATE", "DB_UNIT_CREATE" etc.
        //callback -> the function which is called after the insertion is completed
        //empID -> the employee who is inserting the data

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            if (db) {

                //allow only unique ids for the following:
                /*
                * COLLECTION NAME                   UNIQUE ID NAME
                *
                * "device_collection"               "DeviceID"
                * "unit_collection"                 "UnitID"
                * "employee_collection"             "EmployeeID"
                *
                * */
                let uDID = {}, uUID = {}, uEID = {};
                uDID[KEY_DEVICE_ID] = 1;
                uUID[KEY_UNIT_ID] = 1;
                uEID[KEY_EMPLOYEE_ID] = 1;
                db.db(this.DBName).collection(COLLECTION_NAME_DEVICE).createIndex(uDID, {unique: true});
                db.db(this.DBName).collection(COLLECTION_NAME_UNIT).createIndex(uUID, {unique: true});
                db.db(this.DBName).collection(COLLECTION_NAME_EMPLOYEE).createIndex(uEID, {unique: true});

                //validate jsonData with requiredSchema
                const result = Joi.validate(jsonData, requiredSchema, {allowUnknown: ifAllowUnknown});

                //in case validation failed, return RESULT_BAD_DATA
                if (result.error) callback(actionName, {"result": RESULT_BAD_DATA, "response": result.error.details[0].message});
                else {

                    //schema validation successful

                    //now, search for duplication of uniqueIDName

                    let search_item = {};
                    search_item[uniqueIDName] = jsonData[uniqueIDName];       //query object with uniqueIDName and its value

                    this.queryDB(collectionName, search_item, (request, response) => {

                        if (response.result === RESULT_NO_SUCH_DATA){

                            //this signifies, there is no data predefined with the given uniqueIDName value
                            //So we can insert the element

                            db.db(this.DBName).collection(collectionName).insert(jsonData, (err, res) => {

                                //after operation, close the database
                                db.close();

                                if (err) {
                                    //error; send error
                                    callback(actionName, {
                                        "result": RESULT_ERROR,
                                        "response": "Insert error: " + err
                                    });
                                }
                                else {
                                    //success; log the operation using Logger
                                    this.logger.pushToLog(actionName, collectionName, jsonData, empID);

                                    //send the response
                                    callback(actionName, {"result": RESULT_OK, "response": res})
                                }
                            })

                        }

                        else if (response.result === RESULT_OK){

                            //query was successful i.e. the data with given uniqueIDName is already present
                            //So send RESULT_DUPLICATE_ID
                            callback(actionName, {
                                "result": RESULT_DUPLICATE_ID,
                                "response": `${uniqueIDName}: ${jsonData[uniqueIDName]}`
                            });

                        }

                        else {
                            //query was not complete due to error
                            //i.e. duplication validation error
                            callback(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Validation error " + response.response
                            })
                        }

                    });
                }
            }
        });

    }

    updateDB(jsonData, requiredSchema, ifAllowUnknown, collectionName, uniqueIDName, actionName, callback, empID, doLog){

        //the generic method to update old document of a collection

        //jsonData -> the json object containing data to be updated
        //                  jsonData is of the format:
        //                  {
        //                      <uniqueIDName> : <value>,
        //                      "changes" : {
        //                              .....
        //                      }
        //                  }
        //requiredSchema -> the schema to be enforced in the jsonData["changes"]
        //ifAllowUnknown -> if set to true, any other keys are allowed in the jsonData["changes"] not specified in requiredSchema
        //collectionName -> the collection on which the update is performed
        //uniqueIDName -> before updating, checks for duplication of this field
        //                  Example: a "UnitID" = "SG149_1" is already present
        //                  A new jsonData with the following is not allowed:
        //                  "changes" : { "UnitID" = "SG149_1", ...... }
        //                  So the uniqueIDName = "UnitID"
        //actionName -> the name of the action/request being performed
        //                  Example: "DB_DEVICE_UPDATE", "DB_UNIT_UPDATE" etc.
        //callback -> the function which is called after the update is completed
        //empID -> the employee who is updating the data
        //doLog -> if set to false, the Logger will not log the update

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            if (db) {

                //the schema to check the form of jsonData mentioned earlier
                /*
                *
                * {
                *   <uniqueIDName> : <value>,
                *   "changes" : {
                *       .....
                *   }
                * }
                *
                * */
                const preSchema = {};
                preSchema[uniqueIDName] = Joi.required();
                preSchema[KEY_CHANGES] = Joi.required();

                let JoiResult = Joi.validate(jsonData, preSchema);

                //the jsonData is in the valid form go ahead, else return RESULT_BAD_DATA
                if (JoiResult.error) callback(actionName, {"result": RESULT_BAD_DATA, "response": JoiResult.error.details[0].message});
                else {

                    //check if the given uniqueIDName has an entry in the database

                    let search_original_id = {};        //search item
                    search_original_id[uniqueIDName] = jsonData[uniqueIDName];

                    //query for the uniqueIDName
                    //because we can not update something which is not present
                    this.queryDB(collectionName, search_original_id, (request, response1) => {

                        if (response1.result === RESULT_OK){

                            //entry with the given value in uniqueIDName exists

                            //validating the requiredSchema with jsonData["changes"]
                            JoiResult = Joi.validate(jsonData[KEY_CHANGES], requiredSchema, {allowUnknown: ifAllowUnknown});

                            //if does schema not match, send RESULT_BAD_DATA
                            if (JoiResult.error) callback(actionName, {"result": RESULT_BAD_DATA, "response": JoiResult.error.details[0].message});
                            else {

                                //inside the "changes" part of jsonData, extract the uniqueIDName, if present
                                //(i.e. if uniqueIDName value is to be updated at all)
                                //this new id must not be previously present.

                                /*
                                * Example: uniqueIDName = "UnitID"
                                * say the jsonData is:
                                * {
                                *   "UnitID" : "SG149_1",
                                *   "changes" : {
                                *       "UnitID" : "SM140_1"
                                *   }
                                * }
                                *
                                * This will succeed if "SM140_1" is not previously occupied in "UnitID" of any other document of the collection.
                                * The "changes" may not have the uniqueIDName field, but if it does, then it needs to be validated.
                                *
                                * */

                                //extract the uniqueIDName from jsonData["changes"]
                                let search_updated_id = {};
                                search_updated_id[uniqueIDName] = jsonData[KEY_CHANGES][uniqueIDName];

                                //in case "UnitID" is not specified in "changes",
                                //it will return null
                                //in that case, a search will obviously return RESULT_NO_SUCH_DATA, which is what we want

                                //search
                                this.queryDB(collectionName, search_updated_id, (request, response2) => {

                                    if (response2.result === RESULT_NO_SUCH_DATA) {

                                        //the new unique id is not previously occupied.

                                        //combine the "changes" part of jsonData with the original data
                                        let combined_doc = response1.response[0];

                                        for (let key1 in jsonData[KEY_CHANGES]) {
                                            combined_doc[key1] = jsonData[KEY_CHANGES][key1];
                                        }

                                        //remove fields with value null or undefined
                                        let updated_doc = {};

                                        for (let key2 in combined_doc) {
                                            if (combined_doc[key2] !== null && combined_doc[key2] !== undefined)
                                                updated_doc[key2] = combined_doc[key2];
                                        }

                                        //push the new updated document in the database
                                        db.db(this.DBName).collection(collectionName).update(search_original_id, updated_doc, (err, res) => {

                                            //operation complete, close the db
                                            db.close();

                                            if (err) {
                                                //error
                                                callback(actionName, {
                                                    "result": RESULT_ERROR,
                                                    "response": "Update error: " + err
                                                });
                                            }
                                            else {

                                                //if doLog === false, do not log. Else log.
                                                if (doLog !== false)
                                                    this.logger.pushToLog(actionName, collectionName, jsonData, empID);

                                                //send response to callback
                                                callback(actionName, {"result": RESULT_OK, "response": res});
                                            }
                                        })

                                    }

                                    else if (response2.result === RESULT_OK) {

                                        //the new unique id value is already present
                                        db.close();
                                        callback(actionName, {
                                            "result": RESULT_DUPLICATE_ID,
                                            "response": `Changed ID ${jsonData[KEY_CHANGES][uniqueIDName]} already exists.`
                                        });
                                    }

                                    else {

                                        //error querying new unique id
                                        db.close();
                                        callback(actionName, {
                                            "result": RESULT_ERROR,
                                            "response": "Updated validation error " + response2.response
                                        })
                                    }

                                })
                            }

                        }

                        else if (response1.result === RESULT_NO_SUCH_DATA){

                            //the original document with uniqueIDName does not exist.
                            //hence can not update something which is previously not present
                            callback(actionName, {
                                "result": RESULT_NO_SUCH_DATA,
                                "response": `${uniqueIDName} : ${jsonData[uniqueIDName]}`
                            });

                        }

                        else {

                            //error querying
                            callback(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Validation error " + response1.response
                            })
                        }


                    });
                }
            }
        });


    }

    deleteFromDB(jsonData, collectionName, uniqueIDName, actionName, callback, empID){

        //the generic method to delete a document from a collection

        //jsonData -> the json object indicating what to delete
        //collectionName -> the collection on which the deletion is performed
        //uniqueIDName -> to search exactly what to delete
        //                since it is unique, only one item will be deleted, if exists
        //                Examples of uniqueIDName : "UnitID", "DeviceID", "EmployeeID"
        //actionName -> the name of the action/request being performed
        //                  Example: "DB_DEVICE_DELETE", "DB_UNIT_DELETE" etc.
        //callback -> the function which is called after the deletion is completed
        //empID -> the employee who is deleting the data

        mongoConnector.onMongoConnect(this.DBUrl, callback, (db) => {
            if (db) {

                //connection to mongo dd successful

                const requiredSchema = {};
                requiredSchema[uniqueIDName] = Joi.required();

                /*
                * jsonData is expected to be of the form
                *
                * {
                *       <uniqueIDName> : <value>
                * }
                *
                * and nothing else to be included in the json
                *
                * */

                const result = Joi.validate(jsonData, requiredSchema);

                //the jsonData is in the valid form go ahead, else return RESULT_BAD_DATA
                if (result.error) callback(actionName, {"result": RESULT_BAD_DATA, "response": result.error.details[0].message});
                else {

                    //search if the entry with given value of uniqueIDName exists
                    let search_item = {};
                    search_item[uniqueIDName] = jsonData[uniqueIDName];

                    //querying
                    this.queryDB(collectionName, search_item, (request, response) => {

                        if (response.result === RESULT_OK){

                            //the element exists. So delete it

                            db.db(this.DBName).collection(collectionName).remove(search_item, (err, res) => {

                                //operation complete, close the db
                                db.close();

                                if (err) callback(actionName, {
                                    //error deleting
                                    "result": RESULT_ERROR,
                                    "response": "Deletion error: " + err
                                });
                                else {
                                    //push the deletion activity to logs
                                    this.logger.pushToLog(actionName, collectionName, jsonData, empID);

                                    //send the response
                                    callback(actionName, {"result": RESULT_OK, "response": res});
                                }
                            });

                        }

                        else if (response.result === RESULT_NO_SUCH_DATA){

                            //the entry with given uniqueIDName does not exist
                            callback(actionName, {
                                "result": RESULT_NO_SUCH_DATA,
                                "response": `${uniqueIDName} : ${jsonData[uniqueIDName]}`
                            });

                        }

                        else {

                            //error while querying
                            callback(actionName, {
                                "result": RESULT_ERROR,
                                "response": "Validation error " + response.response
                            })
                        }

                    });
                }
            }
        });

    }

    addDevice(jsonDeviceData, callback, empID) {

        //method to add a device
        //uses addToDB() function

        //designing requiredSchema to validate jsonDeviceData
        let requiredSchema = {};
        requiredSchema[KEY_DEVICE_ID] = Joi.string().required();
        requiredSchema[KEY_DEVICE_TYPE] = Joi.string().required();
        requiredSchema[KEY_DEVICE_MAKE] = Joi.string().required();
        requiredSchema[KEY_DEVICE_MODEL] = Joi.string().allow('').required();
        requiredSchema[KEY_DEVICE_NAME] = Joi.string().required();
        requiredSchema[KEY_DEVICE_RAM] = Joi.string().required();
        requiredSchema[KEY_DEVICE_STORAGE] = Joi.string().required();
        requiredSchema[KEY_DEVICE_OS] = Joi.string().required();
        requiredSchema[KEY_DEVICE_OS_VERSION] = Joi.string().required();
        requiredSchema[KEY_DEVICE_ACCESSORY] = Joi.array().items(Joi.string()).required();
        requiredSchema[KEY_DEVICE_ACCESSORY_STATUS] = Joi.string().valid('available', 'unavailable').required();
        requiredSchema[KEY_DEVICE_COMMENTS] = Joi.string().allow("").required();

        //send the required data to addToDB
        this.addToDB(jsonDeviceData, requiredSchema, true, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_CREATE, callback, empID);
    }

    updateDevice(jsonDeviceData, callback, empID) {

        //method to update a device
        //uses updateDB() function

        //designing requiredSchema to validate jsonDeviceData

        const requiredSchema = {};
        requiredSchema[KEY_DEVICE_ID] = Joi.string();
        requiredSchema[KEY_DEVICE_TYPE] = Joi.string();
        requiredSchema[KEY_DEVICE_MAKE] = Joi.string();
        requiredSchema[KEY_DEVICE_MODEL] = Joi.string().allow('');
        requiredSchema[KEY_DEVICE_NAME] = Joi.string();
        requiredSchema[KEY_DEVICE_RAM] = Joi.string();
        requiredSchema[KEY_DEVICE_STORAGE] = Joi.string();
        requiredSchema[KEY_DEVICE_OS] = Joi.string();
        requiredSchema[KEY_DEVICE_OS_VERSION] = Joi.string();
        requiredSchema[KEY_DEVICE_ACCESSORY] = Joi.array().items(Joi.string());
        requiredSchema[KEY_DEVICE_ACCESSORY_STATUS] = Joi.string().valid('available', 'unavailable');
        requiredSchema[KEY_DEVICE_COMMENTS] = Joi.string().allow("");

        //send the required data to addToDB
        this.updateDB(jsonDeviceData, requiredSchema, true, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_UPDATE, callback, empID);
    }

    deleteDevice(jsonDeviceData, callback, empID) {

        //method to delete a device.
        //uses deleteFromDB() method
        this.deleteFromDB(jsonDeviceData, COLLECTION_NAME_DEVICE, KEY_DEVICE_ID, ACTION_DEVICE_DELETE, callback, empID);
    }

    addUnit(jsonUnitData, callback, empID) {

        //method to add a unit of a device

        //Each unit must be linked to a device by the "DeviceID" field
        //So we must validate the presence of the value of a given "DeviceID" in the json data of a new unit

        //make a search item with the given "DeviceID", if not undefined
        let search_item = {};
        let id = jsonUnitData[KEY_DEVICE_ID];
        if (id) search_item[KEY_DEVICE_ID] = id;

        //querying for the "DeviceID"
        this.queryDB(COLLECTION_NAME_DEVICE, search_item, (request, response) => {

            if (response.result === RESULT_OK){

                //the given value of the "DeviceID" exists in "device_collection"
                //so we can proceed with adding the unit

                //declaring the requiredSchema
                let requiredSchema = {};
                requiredSchema[KEY_UNIT_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3).required();
                requiredSchema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.any();
                requiredSchema[KEY_UNIT_CONDITION] = Joi.string().valid('healthy', 'repair', 'dead').required();
                jsonUnitData[KEY_EMPLOYEE_REGISTRATION_ID] = "none";        //initially, the unit is not issued.

                //passing the required data to addToDB() function
                this.addToDB(jsonUnitData, requiredSchema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_CREATE, callback, empID);

            }

            else if (response.result === RESULT_NO_SUCH_DATA){

                //the "DeviceID" is not present

                callback(ACTION_UNIT_CREATE, {
                    "result": RESULT_NO_SUCH_DATA,
                    "response": `${KEY_DEVICE_ID} : ${jsonUnitData[KEY_DEVICE_ID]}`
                });

            }

            else {
                //error querying the "DeviceID" in the "device_collection"
                callback(ACTION_UNIT_CREATE, {
                    "result": RESULT_ERROR,
                    "response": "Validation error " + response.response
                })
            }

        });
    }

    updateUnit(jsonUnitData, callback, empID){

        //similar to adding the unit, while updating, the "DeviceID" needs to be checked, if present
        /*
        *
        * Expected form of jsonUnitData
        * {
        *       "UnitID" : <value>,
        *       "changes" : {
        *       ......
        *       }
        * }
        *
        * the "changes" may or may not have "DeviceID",
        * but if it does, it needs to be validated
        *
        * */

        //making a search item with the "DeviceID", if present in the "changes"
        let search_device = {};
        let dID = jsonUnitData[KEY_CHANGES][KEY_DEVICE_ID];
        if (dID) search_device[KEY_DEVICE_ID] = dID;

        //if a new "DeviceID" is not given in "changes"
        // then search_device = {} will always return RESULT_OK if queried, which is what we want.

        this.queryDB(COLLECTION_NAME_DEVICE, search_device, (request, response) => {

            if (response.result === RESULT_OK){

                //the new "DeviceID", if present, exists.

                //the "EmployeeRegistrationID" field cannot be changed form this method
                //use the submitUnit() and issueUnit() method to do it.
                let eID = jsonUnitData[KEY_CHANGES][KEY_EMPLOYEE_REGISTRATION_ID];
                if (!eID){

                    //the "EmployeeRegistrationID" is not present under "changes", so continue

                    //make the requiredSchema
                    let requiredSchema = {};
                    requiredSchema[KEY_UNIT_ID] = Joi.string().min(3);
                    requiredSchema[KEY_DEVICE_ID] = Joi.string().min(3);
                    requiredSchema[KEY_UNIT_CONDITION] = Joi.string().valid('healthy', 'repair', 'dead');

                    //send the required data to updateDB() method
                    this.updateDB(jsonUnitData, requiredSchema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_UPDATE, callback, empID);
                }
                else {

                    //if "EmployeeRegistrationID" is present, send RESULT_BAD_DATA
                    callback(ACTION_UNIT_UPDATE, {"result" : RESULT_BAD_DATA, "response" : `Use issueUnit() or submitUnit() to update ${KEY_EMPLOYEE_REGISTRATION_ID}`});
                }

            }

            else if (response.result === RESULT_NO_SUCH_DATA){

                //the given "DeviceID" under "changes" is not present

                callback(ACTION_UNIT_UPDATE, {
                    "result": RESULT_NO_SUCH_DATA,
                    "response": `${KEY_DEVICE_ID} : ${jsonUnitData[KEY_DEVICE_ID]}`
                });

            }

            else {

                //update error
                callback(ACTION_UNIT_UPDATE, {
                    "result": RESULT_ERROR,
                    "response": "Validation error " + response.response
                })
            }

        });
    }

    deleteUnit(jsonUnitData, callback, empID){
        //method to delete a unit
        //uses deleteFromDB() method
        this.deleteFromDB(jsonUnitData, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_UNIT_DELETE, callback, empID);
    }

    issueUnit(jsonUnitData, callback, empID){

        let requiredSchema = {};
        requiredSchema[KEY_UNIT_ID] = Joi.string().min(3).required();
        requiredSchema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.string().min(3).required();

        const result = Joi.validate(jsonUnitData, requiredSchema);

        if (result.error) callback(ACTION_ISSUE_UNIT, {"result": RESULT_BAD_DATA, "response": result.error.details[0].message});
        else {

            let search_employee = {};
            search_employee[KEY_EMPLOYEE_ID] = jsonUnitData[KEY_EMPLOYEE_REGISTRATION_ID];

            let update_unit = {}, changes = {};
            update_unit[KEY_UNIT_ID] = jsonUnitData[KEY_UNIT_ID];
            changes[KEY_EMPLOYEE_REGISTRATION_ID] = jsonUnitData[KEY_EMPLOYEE_REGISTRATION_ID];
            update_unit[KEY_CHANGES] = changes;

            let schema = {};
            schema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.string().min(3).required();

            this.queryDB(COLLECTION_NAME_EMPLOYEE, search_employee, (request, response) => {

                if (response.result === RESULT_OK) {

                    this.updateDB(update_unit, schema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_ISSUE_UNIT, (request, response) => {

                        if (response.result === RESULT_OK)
                            this.logger.pushUnitTransaction(ACTION_ISSUE_UNIT, jsonUnitData[KEY_EMPLOYEE_REGISTRATION_ID], jsonUnitData[KEY_UNIT_ID], empID, null);

                        callback(request, response);

                    }, null, false);
                }

                else if (response.result === RESULT_NO_SUCH_DATA) {

                    callback(ACTION_ISSUE_UNIT, {
                        "result": RESULT_NO_SUCH_DATA,
                        "response": `${KEY_EMPLOYEE_REGISTRATION_ID} : ${jsonUnitData[KEY_EMPLOYEE_REGISTRATION_ID]}`
                    });

                }

                else {
                    callback(ACTION_ISSUE_UNIT, {
                        "result": RESULT_ERROR,
                        "response": "Validation error " + response.response
                    })
                }
            })

        }

    }

    submitUnit(jsonUnitData, callback, empID){

        let jsonDataCopy = {};
        jsonDataCopy[KEY_UNIT_ID] = jsonUnitData[KEY_UNIT_ID];
        let eid;

        let changes = {};
        changes[KEY_EMPLOYEE_REGISTRATION_ID] = "none";
        jsonUnitData[KEY_CHANGES] = changes;

        const requiredSchema = {};
        requiredSchema[KEY_EMPLOYEE_REGISTRATION_ID] = Joi.string().min(3);

        this.queryDB(COLLECTION_NAME_UNIT, jsonDataCopy, (request, response) => {

            if (response.response[0])
            eid = response.response[0][KEY_EMPLOYEE_REGISTRATION_ID];

            this.updateDB(jsonUnitData, requiredSchema, false, COLLECTION_NAME_UNIT, KEY_UNIT_ID, ACTION_SUBMIT_UNIT, (request, response) => {
                if (response.result === RESULT_OK)
                    this.logger.pushUnitTransaction(ACTION_SUBMIT_UNIT, eid, jsonUnitData[KEY_UNIT_ID], empID, null);

                callback(request, response);
            }, null, false);

        });

    }

    addEmployee(jsonEmployeeData, callback) {

        //method to add an employee

        //defining requiredSchema
        let requiredSchema = {};
        requiredSchema[KEY_EMPLOYEE_NAME] = Joi.string().min(3).required();
        requiredSchema[KEY_EMPLOYEE_ID] = Joi.string().min(3).required();
        requiredSchema[KEY_EMPLOYEE_EMAIL] = Joi.string().email().required();
        requiredSchema[KEY_EMPLOYEE_MOBILE] = Joi.string().min(10).required();
        requiredSchema[KEY_EMPLOYEE_PASSWD] = Joi.string().min(6).required();
        requiredSchema[KEY_EMPLOYEE_ISADMIN] = Joi.boolean().required();

        //hash the password
        let passwd = jsonEmployeeData[KEY_EMPLOYEE_PASSWD];
        if (passwd) jsonEmployeeData[KEY_EMPLOYEE_PASSWD] = bcryptjs.hashSync(passwd);

        //set "IsActive" to true by default
        jsonEmployeeData[KEY_EMPLOYEE_ISACTIVE] = true;

        //send the data to addToDB() method
        this.addToDB(jsonEmployeeData, requiredSchema, true, COLLECTION_NAME_EMPLOYEE, KEY_EMPLOYEE_ID, ACTION_EMPLOYEE_CREATE, callback);
    }

    updateEmployee(jsonEmployeeData, callback, empID) {

        //method to update details of an employee

        //defining requiredSchema
        const requiredSchema = {};

        requiredSchema[KEY_EMPLOYEE_NAME] = Joi.string().min(3);
        requiredSchema[KEY_EMPLOYEE_ID] = Joi.string().min(3);
        requiredSchema[KEY_EMPLOYEE_EMAIL] = Joi.string().email();
        requiredSchema[KEY_EMPLOYEE_MOBILE] = Joi.string().min(10);
        requiredSchema[KEY_EMPLOYEE_PASSWD] = Joi.string().min(6);
        requiredSchema[KEY_EMPLOYEE_ISADMIN] = Joi.boolean();
        requiredSchema[KEY_EMPLOYEE_ISACTIVE] = Joi.boolean();

        //hash the new password, if present under "changes"
        try {
            let passwd = jsonEmployeeData[KEY_CHANGES][KEY_EMPLOYEE_PASSWD];
            let salt = bcryptjs.genSaltSync(10);
            if (passwd) jsonEmployeeData[KEY_CHANGES][KEY_EMPLOYEE_PASSWD] = bcryptjs.hashSync(passwd, salt);
        }
        catch (e){}

        //send the required data to updateDB() method
        this.updateDB(jsonEmployeeData, requiredSchema, true, COLLECTION_NAME_EMPLOYEE, KEY_EMPLOYEE_ID, ACTION_EMPLOYEE_UPDATE, callback, empID);
    }

    deleteEmployee(jsonEmployeeData, callback, empID){
        //method to delete an employee from database
        //uses deleteFromDB() method
        this.deleteFromDB(jsonEmployeeData, COLLECTION_NAME_EMPLOYEE, KEY_EMPLOYEE_ID, ACTION_EMPLOYEE_DELETE, callback, empID);
    }

}

//exposing the class
module.exports.DBOperationClass = DBOperation;

//exposing required constants
module.exports.ACTION_DB_OPEN = ACTION_DB_OPEN;
module.exports.ACTION_QUERY_COMPLETE = ACTION_QUERY_COMPLETE;
module.exports.ACTION_DEVICE_CREATE = ACTION_DEVICE_CREATE;
module.exports.ACTION_DEVICE_UPDATE = ACTION_DEVICE_UPDATE;
module.exports.ACTION_DEVICE_DELETE = ACTION_DEVICE_DELETE;
module.exports.ACTION_UNIT_CREATE = ACTION_UNIT_CREATE;
module.exports.ACTION_UNIT_UPDATE = ACTION_UNIT_UPDATE;
module.exports.ACTION_UNIT_DELETE = ACTION_UNIT_DELETE;
module.exports.ACTION_ISSUE_UNIT = ACTION_ISSUE_UNIT;
module.exports.ACTION_SUBMIT_UNIT = ACTION_SUBMIT_UNIT;

module.exports.RESULT_OK = RESULT_OK;
module.exports.RESULT_ERROR = RESULT_ERROR;
module.exports.RESULT_BAD_DATA = RESULT_BAD_DATA;
module.exports.RESULT_NO_SUCH_DATA = RESULT_NO_SUCH_DATA;
module.exports.RESULT_DUPLICATE_ID = RESULT_DUPLICATE_ID;

module.exports.COLLECTION_NAME_DEVICE = COLLECTION_NAME_DEVICE;
module.exports.COLLECTION_NAME_UNIT = COLLECTION_NAME_UNIT;
module.exports.COLLECTION_NAME_EMPLOYEE = COLLECTION_NAME_EMPLOYEE;

module.exports.KEY_EMPLOYEE_REGISTRATION_ID = KEY_EMPLOYEE_REGISTRATION_ID;
module.exports.KEY_EMPLOYEE_ID = KEY_EMPLOYEE_ID;
module.exports.KEY_EMPLOYEE_ISADMIN = KEY_EMPLOYEE_ISADMIN;
module.exports.KEY_UNIT_ID = KEY_UNIT_ID;
module.exports.KEY_EMPLOYEE_ISACTIVE = KEY_EMPLOYEE_ISACTIVE;
module.exports.KEY_EMPLOYEE_PASSWD = KEY_EMPLOYEE_PASSWD;
module.exports.KEY_EMPLOYEE_NAME = KEY_EMPLOYEE_NAME;