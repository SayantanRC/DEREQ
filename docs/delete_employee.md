# Delete employee/user account

An employee/user should have option to remove his/her account. This section shows how to do that.

   
 - In the payload, send:
	 >{  
       	"EmployeeID" : "sam121"  
       }
     
     `Only "EmployeeID" is allowed.`
     
 - Send the payload to **http://localhost:2000/delete/employee** (might change on how the project is hosted)
	 
 - Response should be something like:
 ```
 {
     "request": "DB_EMPLOYEE_DELETE",
     "result": "RESULT_OK",
     "message": {
         "n": 1,
         "ok": 1
     }
 }
 ```
- The following values are to be noted:
    - `request` : `DB_EMPLOYEE_DELETE`
    - `result` : `RESULT_OK`

### Possible other results

- Status code 200  
    - `result` : `RESULT_OK` - All information about the employee was deleted from the database. 
- Status code 404  
    - `result` : `RESULT_NO_SUCH_DATA` - Occurs if the given `EmployeeID` is not present in database.    
- Status code 400
    - `result` : `RESULT_BAD_DATA` - `EmployeeID` was not present, or unnecessary information was sent in the payload.
- Status code 500
    - `result` : `RESULT_ERROR` - Error occurred. Check if `mongod` server is running.