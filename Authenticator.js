
//dependencies
const DBOperation = require('./DBOperation');
const jwt = require('jsonwebtoken');

//string key to sign token
const AUTH_KEY = 'dereq_auth_key';

//function to generate token
//uses employee id and admin status
function generateToken(eid, isAdmin, callback){

    //json object to sign by jwt
    const jData = {};
    jData[DBOperation.KEY_EMPLOYEE_ID] = eid;
    jData[DBOperation.KEY_EMPLOYEE_ISADMIN] = isAdmin;

    //signing using jwt
    jwt.sign(jData, AUTH_KEY, {expiresIn: '30m'}, (err, token) => {

        //if no error is raised, send the token to callback function
        if (!err)
            callback(token);

        //for an error, send null
        else callback(null);
    });
}

//function to verify token
//takes a token as input
function verifyToken(token, callback){

    //using jwt to verify
    jwt.verify(token, AUTH_KEY, (err, res) => {

        //in case of error, return null
        if (err)
            callback(null);

        //else return the decoded token to callback function
        else callback(res);
    });
}

//parent method which handles verification of tokens
//this method uses verifyToken() method
function handleAuthorization(req, res, callback, isAdmin){

    //the client sends the token in the header
    //isAdmin, if true, requires that the command be executed only by an admin

    //extract the header from the request the header
    const auth_header = req.headers['authorization'];

    //if a header is present, continue...
    if (auth_header){

        //token in the header is in the format: "Bearer <token>"
        //so if it is split in an array with delimiter = ' '
        //the token will be in the 2nd element, i.e. index 1

        const token = auth_header.split(' ')[1];

        //calling the verifyToken()
        verifyToken(token, (response) => {

            if (response) {

                //returned decoded token is not null

                if (!isAdmin) {

                    //admin permission is not required for the command
                    //so return the response to callback
                    callback(response);

                }
                else if (isAdmin && response[DBOperation.KEY_EMPLOYEE_ISADMIN] === true) {

                    //admin permission is required
                    //also the admin flag found from decoding the token is true
                    //so employee is an admin
                    //return the response

                    callback(response);
                }
                else {

                    //only other option left
                    //isAdmin is true, but employee in not an admin

                    res.status(403).send("Operation only for admins"); //Forbidden
                }
            }

            //response from verifyToken() is null if invalid token is passed
            else res.status(401).send("Token timeout or invalid token"); //Unauthorized
        })
    }

    //the header (and hence the token) is not present
    else res.status(401).send("Token not found"); //Unauthorized
}

//exposing the functions for access
module.exports.generateToken = generateToken;
module.exports.verifyToken = verifyToken;
module.exports.handleAuthorization = handleAuthorization;