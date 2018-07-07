# Login, send and manage tokens
### Login to get a token

 - Login with a valid employee id and password:  
    In the payload, send:
	 >{  
	 "EmployeeID" : "sam121",  
	 "Password" : "samirg111"  
	 }  
	 
 - Send the payload to http://localhost:2000/login (might change on how the project is hosted)
	 
 - Response should be something like:
 ```
 {
 "EmployeeID": "sam121",
 "IsAdmin": false,
 "EmployeeName": "Samir Ghosh",
 "token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlEIjoiYW51cGFtMTAwIiwiSXNBZG1pbiI6ZmFsc2UsImlhdCI6MTUzMDg4OTE4MywiZXhwIjoxNTMwODkwOTgzfQ.yMZrKDh2sYxlFz1XHaZ0NtIcqpXCzmAtaVPUAYlrwgE"
 }
 ```
- This token will be valid for **30 minutes** only.

### To send further requests using this token

- In the header of the post request, for the key "Authorization", send "Bearer [token]"

Example using Postman:

```
1. Select POST request.
2. Go to Header section below the url bar.
3. Make a new key with name "Authorization" and value "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlEIjoiYW51cGFtMTAwIiwiSXNBZG1pbiI6ZmFsc2UsImlhdCI6MTUzMDg4OTE4MywiZXhwIjoxNTMwODkwOTgzfQ.yMZrKDh2sYxlFz1XHaZ0NtIcqpXCzmAtaVPUAYlrwgE"
4. Put the JSON request in the Body.
5. Hit Send.
```

Example using Node JS code:

```
var request = require('request');

    //lets search for devices with RAM 3 GB

    let reqJson = {
        "RAM" : 3
    };

    request({
    
        url: "http://localhost:2000/query/device",
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization" : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJFbXBsb3llZUlEIjoiYW51cGFtMTAwIiwiSXNBZG1pbiI6ZmFsc2UsImlhdCI6MTUzMDg4OTE4MywiZXhwIjoxNTMwODkwOTgzfQ.yMZrKDh2sYxlFz1XHaZ0NtIcqpXCzmAtaVPUAYlrwgE"
        },
        json : true,
        body: reqJson
    },
    
    function (error, response, body){
    
        // do the job here, like print the reponse
        console.log(body);
        
    });
```

### Possible results

- Status code 200 : Token is successfully generated
- Status code 500 : <b>Login token generation error</b> - Check if `mongod` server is running
- Status code 404 : <b>Account not found</b> - The given `EmployeeID` is not registered in the database.
- Status code 401 : <b>Wrong password</b> - The `Password` field does not match with `EmployeeID`
- Status code 401 : <b>Inactive account</b> - The account with the given `EmployeeID` isn't active (`IsActive` is set to false).
