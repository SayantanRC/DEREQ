
//dependencies
const express = require('express');
const DBOperation = require('./DBOperation');
const authenticator = require('./Authenticator');
const bcryptjs = require('bcryptjs');

//make an express router
const router = express.Router();

//set appUrl, mongo db port, database name
const appUrl = process.env.APP_URL || "localhost";
const DBPort = process.env.MONGO_PORT || 27017;
const DBName = process.env.MONGO_DBNAME || "master_db";

//object of DBOperationClass
const DBOpObj = new DBOperation.DBOperationClass(DBPort, appUrl, DBName);

router.use(express.json());

//This method adds an appropriate status code to the response
//based on the result of database operation
const genericDBoperatinHandler = (request, response, res) => {
    if (response.result === DBOperation.RESULT_ERROR)
        res.status(500); //Internal error
    else if (response.result === DBOperation.RESULT_NO_SUCH_DATA)
        res.status(404); //Not found
    else if (response.result === DBOperation.RESULT_BAD_DATA)
        res.status(400); //Bad request
    else if (response.result === DBOperation.RESULT_DUPLICATE_ID)
        res.status(409); //Conflict
    res.send({"request" : request, "result" : response.result, "message" : response.response})
};

//various router endpoints begin here. See README.md for details.

//query for devices
router.post('/query/device/', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        // job to perform if authentication succeeds

        DBOpObj.queryDB(DBOperation.COLLECTION_NAME_DEVICE, req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            // log the query, so pass true
            true,

            // send who initiated the query
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    });
});

//add a device. Admin only
router.post('/add/device', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.addDevice(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },

            // send the admin id
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    },

        //operation only for admin, so pass true
        true);
});

//update device, admin only
router.post('/update/device', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.updateDevice(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },

            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    },

        //operation only for admin, so pass true
        true);
});

//delete a device
router.post('/delete/device', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.deleteDevice(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    },

        //operation only for admin, so pass true
        true);
});

//query a unit
router.post('/query/unit/', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.queryDB(DBOperation.COLLECTION_NAME_UNIT, req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            //log the query, so pass true
            true,

            //pass who issues the query
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    })
});

//add unit for a device
router.post('/add/unit', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.addUnit(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    },

        //operation only for admin, so pass true
        true);
});

//update unit details
router.post('/update/unit', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.updateUnit(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    },

        //operation only for admin, so pass true
        true);
});

//delete a unit
router.post('/delete/unit', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.deleteUnit(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    },

        //operation only for admin, so pass true
        true);
});

//query information about an employee
router.post('/query/employee/', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.queryDB(DBOperation.COLLECTION_NAME_EMPLOYEE, req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            true, // log the query
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    },
        //operation only for admin, so pass true
        true);
});

//add/register an employee
router.post('/add/employee', (req, res) => {

    //token verification is not needed for new member

    DBOpObj.addEmployee(req.body, (request, response) => {
        genericDBoperatinHandler(request, response, res);
    });

});

//update employee details
router.post('/update/employee', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.updateEmployee(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    });
});

//delete an employee account
router.post('/delete/employee', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.deleteEmployee(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        );
    });
});

//issue unit for an employee
router.post('/unit/issue', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.issueUnit(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            //send the requesting employee id
            tokenData[DBOperation.KEY_EMPLOYEE_ID],

            //send if the requesting employee id is an admin
            tokenData[DBOperation.KEY_EMPLOYEE_ISADMIN]
        );
    });
});

//submit the issued unit
router.post('/unit/submit', (req, res) => {

    authenticator.handleAuthorization(req, res, (tokenData) => {
        DBOpObj.submitUnit(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            //send the requesting employee id
            tokenData[DBOperation.KEY_EMPLOYEE_ID],

            //send if the requesting employee id is an admin
            tokenData[DBOperation.KEY_EMPLOYEE_ISADMIN]
        );
    });
});

//get logs
router.post('/log/get', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {
        DBOpObj.logger.getLog(req.body, (request, response) => {
            genericDBoperatinHandler(request, response, res);
        },

            //send the requesting employee id
            tokenData[DBOperation.KEY_EMPLOYEE_ID],

            //send if the requesting employee id is an admin
            tokenData[DBOperation.KEY_EMPLOYEE_ISADMIN]

        )
    });
});

//clear logs
router.post('/log/clear', (req, res) => {
    authenticator.handleAuthorization(req, res, (tokenData) => {

        DBOpObj.logger.clearLog((request, response) => {
            genericDBoperatinHandler(request, response, res);
        },
            tokenData[DBOperation.KEY_EMPLOYEE_ID]
        )
    },
        //admin only operation, so pass true
        true);
});

//login a user/employee
router.post('/login', (req, res) => {

    //extract the employee id
    let eid = req.body[DBOperation.KEY_EMPLOYEE_ID];

    //extract the password and set it to "" if null
    let passwd = req.body[DBOperation.KEY_EMPLOYEE_PASSWD];
    if (!passwd) passwd = "";

    //query json to find the employee id
    let query = {};
    query[DBOperation.KEY_EMPLOYEE_ID] = eid;

    //search for the employee id
    DBOpObj.queryDB(DBOperation.COLLECTION_NAME_EMPLOYEE, query, (request, response) => {

        if (response.result === DBOperation.RESULT_OK){

            // given employee id is valid

            if (response.response[0][DBOperation.KEY_EMPLOYEE_ISACTIVE]) {

                //check if employee is active

                bcryptjs.compare(passwd, response.response[0][DBOperation.KEY_EMPLOYEE_PASSWD], (err, isMatch) => {

                    if (isMatch) {

                        //given password matches

                        let isAdmin = response.response[0][DBOperation.KEY_EMPLOYEE_ISADMIN]; //extract admin status of employee

                        authenticator.generateToken(eid, isAdmin, (token) => {

                            //token generated with employee id and admin status

                            let tokenInfo = {};     //returning json
                            tokenInfo[DBOperation.KEY_EMPLOYEE_ID] = eid;       //employee id
                            tokenInfo[DBOperation.KEY_EMPLOYEE_ISADMIN] = isAdmin;  //admin status
                            tokenInfo[DBOperation.KEY_EMPLOYEE_NAME] = response.response[0][DBOperation.KEY_EMPLOYEE_NAME]; //employee name
                            tokenInfo["token"] = token; //actual generated token

                            //send the information
                            res.json(tokenInfo);
                        })

                    }
                    else {

                        //password did not match
                        res.status(401).send("Wrong password");
                    }
                });
            }
            else {

                //employee is not active
                res.status(401).send("Inactive account");
            }

        }
        else if (response.result === DBOperation.RESULT_ERROR) {

            //error searching for employee id. So can not proceed with token generation
            res.status(500).send("Login token generation error");
        }
        else {

            //the employee id is not present in database
            res.status(404).send("Account not found");
        }
    });
});

//export the router object
module.exports = router;