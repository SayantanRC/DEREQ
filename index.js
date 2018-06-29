const exp = require('express');
const expApp = exp();
const DBOperation = require('./DBOperation');

const appPort = 2000;
const appUrl = "localhost";
const DBPort = 27017;
const DBName = "master_db";

const DBOpObj = new DBOperation.DBOperationClass(DBPort, appUrl, DBName);

expApp.use(exp.json());

const genericDBoperatinHandler = (request, response, res) => {
    res.send({"request" : request, "result" : response.result, "message" : response.response})
};

expApp.post('/query/device/', (req, res) => {
    DBOpObj.queryDB(DBOperation.COLLECTION_NAME_DEVICE, req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });
});

expApp.post('/add/device', (req, res) => {
    DBOpObj.addDevice(req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });
});

expApp.post('/update/device', (req, res) => {
    DBOpObj.updateDevice(req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });
});

expApp.post('/delete/device', (req, res) => {
    DBOpObj.deleteDevice(req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });
});

expApp.post('/query/unit/', (req, res) => {
    DBOpObj.queryDB(DBOperation.COLLECTION_NAME_UNIT, req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });
});

expApp.post('/add/unit', (req, res) => {
    DBOpObj.addUnit(req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });
});


expApp.post('/update/unit', (req, res) => {
    DBOpObj.updateUnit(req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });
});

expApp.listen(appPort, () => {
    console.log("Listening...");
});