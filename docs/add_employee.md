# New employee/user registration

Used for new registration. An employee can have admin rights (`IsAdmin = true`), which allows actions like adding, removing other devices, units etc.  
The `EmployeeID` can be asked from the user, like prompting him/her to choose a unique "Username" or "Handle name" like that used in Twitter. 
   
 - In the payload, send:
	 >{  
     	"EmployeeName" : "Samir Ghosh",  
     	"EmployeeID" : "sam121",  
     	"Email" : "samirghosh95@gmail.com",  
     	"MobileNo" : 9996454321,  
     	"Password" : "samirg111",  
     	"IsAdmin" : false  
     }  
     
 - Send the payload to **http://localhost:2000/add/employee** (might change on how the project is hosted)
	 
 - Response should be something like:
 ```
 {
     "request": "DB_EMPLOYEE_CREATE",
     "result": "RESULT_OK",
     "message": {
         "result": {
             "ok": 1,
             "n": 1
         },
         "ops": [
             {
                 "EmployeeName": "Samir Ghosh",
                 "EmployeeID": "sam121",
                 "Email": "samirghosh95@gmail.com",
                 "MobileNo": 9996454321,
                 "Password": "$2a$10$uGHW/EGgMD3k5abktVYybOKQdgX0Faobai5aTZwc5qfp8DwKZEd6W",
                 "IsAdmin": false,
                 "IsActive": true,
                 "_id": "5b3fa2f5db440139566d87c0"
             }
         ],
         "insertedCount": 1,
         "insertedIds": {
             "0": "5b3fa2f5db440139566d87c0"
         }
     }
 }
 ```
- The following values are to be noted:
    - `request` : `DB_EMPLOYEE_CREATE`
    - `result` : `RESULT_OK`

### Possible other results

- Status code 200  
    - `result` : `RESULT_OK` - The employee with the given values have been inserted in the database. 
- Status code 409  
    - `result` : `RESULT_DUPLICATE_ID` - An employee with the given `EmployeeID` is already present. This value needs to be changed  
- Status code 400
    - `result` : `RESULT_BAD_DATA` - An expected value was not present in the JSON body, like `MobileNo` or `Email`. See the `message` field for details.
- Status code 500
    - `result` : `RESULT_ERROR` - Error occurred. Check if `mongod` server is running.