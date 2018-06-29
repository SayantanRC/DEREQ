const exp = require('express');
const expApp = exp();
const DBOperation = require('./DBOperation');
const DBOpObj = new DBOperation.DBOperationClass();

const appPort = 2000;
const DBPort = 27017;
const DBName = "master_db";

expApp.use(exp.json());

let responseSend;

//Database operations

expApp.get('/', (req, res) => {
    responseSend = res;
    DBOpObj.init(DBPort, "localhost", DBName);
});

expApp.get('/open', (req, res) => {
    responseSend = res;
    DBOpObj.openDB();
});

expApp.get('/close', (req, res) => {
    responseSend = res;
    DBOpObj.closeDB();
});

//Collection - Device

expApp.get('/query/device/', (req, res) => {
    responseSend = res;
    DBOpObj.queryDB(DBOperation.COLLECTION_NAME_DEVICE, "{}");
});

expApp.get('/query/device/:jsonQueryString', (req, res) => {
    responseSend = res;
    DBOpObj.queryDB(DBOperation.COLLECTION_NAME_DEVICE, req.params.jsonQueryString);
});

expApp.post('/add/device', (req, res) => {
    responseSend = res;
    DBOpObj.addDevice(req.body);
});

expApp.put('/update/device', (req, res) => {
    responseSend = res;
    DBOpObj.updateDevice(req.body);
});

expApp.delete('/delete/device', (req, res) => {
    responseSend = res;
    DBOpObj.deleteDevice(req.body);
});

expApp.get('/query/unit/', (req, res) => {
    responseSend = res;
    DBOpObj.queryDB(DBOperation.COLLECTION_NAME_UNIT, "{}");
});

expApp.get('/query/unit/:jsonQueryString', (req, res) => {
    responseSend = res;
    DBOpObj.queryDB(DBOperation.COLLECTION_NAME_UNIT, req.params.jsonQueryString);
});

expApp.post('/add/unit', (req, res) => {
    responseSend = res;
    DBOpObj.addUnit(req.body);
});


expApp.put('/update/unit', (req, res) => {
    responseSend = res;
    DBOpObj.updateUnit(req.body);
});

expApp.listen(appPort, () => {
    console.log("Listening...");
});

//Result listeners

const genericDBoperatinHandler = (res, req) => {
    let message;
    if (res.result === DBOperation.RESULT_YES) message = res.response;
    else if (res.result === DBOperation.RESULT_NO) message = "DB uninitialised";
    else message = res.response;
    responseSend.send({"request" : req, "result" : res.result, "message" : message})
};

DBOpObj.on(DBOperation.ACTION_DB_OPENED, (res) => {
    let message;
    if (res.result === DBOperation.RESULT_YES) message = "DB opened at : " + res.response;
    else if (res.result === DBOperation.RESULT_NO) message = "DB already open at : " + res.response;
    else message = "Failed to open DB : " + res.response;
    responseSend.send({"request" : DBOperation.ACTION_DB_OPENED, "result" : res.result, "message" : message})
});

DBOpObj.on(DBOperation.ACTION_DB_CLOSED, (res) => {
    let message;
    if (res.result === DBOperation.RESULT_YES) message = "DB closed";
    else message = "DB already closed";
    responseSend.send({"request" : DBOperation.ACTION_DB_CLOSED, "result" : res.result, "message" : message});
});

DBOpObj.on(DBOperation.ACTION_QUERY_COMPLETE, (res) => { genericDBoperatinHandler(res, DBOperation.ACTION_QUERY_COMPLETE) });
DBOpObj.on(DBOperation.ACTION_DEVICE_CREATE, (res) => { genericDBoperatinHandler(res, DBOperation.ACTION_DEVICE_CREATE) });
DBOpObj.on(DBOperation.ACTION_DEVICE_UPDATE, (res) => { genericDBoperatinHandler(res, DBOperation.ACTION_DEVICE_UPDATE) });
DBOpObj.on(DBOperation.ACTION_DEVICE_DELETE, (res) => { genericDBoperatinHandler(res, DBOperation.ACTION_DEVICE_DELETE) });
DBOpObj.on(DBOperation.ACTION_UNIT_CREATE, (res) => { genericDBoperatinHandler(res, DBOperation.ACTION_UNIT_CREATE) });
DBOpObj.on(DBOperation.ACTION_UNIT_UPDATE, (res) => { genericDBoperatinHandler(res, DBOperation.ACTION_UNIT_UPDATE) });

/*
* USAGE:
* Install Postman : https://www.getpostman.com/apps
*
* 1. To initialise the db
*
* Open Postman
* Run this file
* Top left corner, Select dropdown and click GET (other options are POST, PUT, DELETE etc.)
* In the "Enter request url", enter : http://localhost:2000/
* Press enter
*
* 2. To close the db
*
* In the "Enter request url", enter : http://localhost:2000/close
* Press enter
*
* 3. To reopen
*
* In the "Enter request url", enter : http://localhost:2000/open
*
* 4. To add a device
*
* Top left corner, Select dropdown and click POST instead of GET
* Below the url bar, open the "Body"
* Select "raw" radiobutton
* Click on the dropdown "Text" and select "JSON(application/json)"
* In the text box enter
    {
	"DeviceID" : "M203",
	"DeviceName" : "Motorola Moto X4",
	"ScreenSize" : 5.2,
	"WaterResistance" : true
    }
* In the "Enter request url", enter : http://localhost:2000/addDevce
* press Enter/Send
*
* Other devices can be similarly added
*
* 5. To query all devices
*
* Top left corner, Select dropdown and click GET
* In the "Enter request url", enter : http://localhost:2000/query/device_collection/
* Press Enter/Send
*
* 6. To query with condition
*
* Top left corner, Select dropdown and click GET
* In the "Enter request url", enter : http://localhost:2000/query/device_collection/{"ScreenSize" : 5.2}
* Press Enter/Send
* lists all devices having screen size 5.2 inch
*
* 7. To update a device
*
* Top left corner, Select dropdown and click PUT
* In the "Enter request url", enter : http://localhost:2000/updateDevice
* In the text box, enter: (DeviceID must be entered)
    {
	"DeviceID" : "M203",
	"OS" : "Android 8.0",
	"Battery" : "3000 mAh"
    }
* press Enter/Send
*
* 8. To delete a device
*
* Top left corner, Select dropdown and click DELETE
* In the "Enter request url", enter : http://localhost:2000/deleteDevice
* In the text box, enter: (only DeviceID must be entered, nothing else)
    {
	"DeviceID" : "M203"
    }
* press Enter/Send
* */