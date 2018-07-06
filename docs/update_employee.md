# Update employee/user account details

Used to update fields like mobile number or email and even `EmployeeID`. This does not requires admin access, as each employee should be able to change his/her details.
   
 - In the payload, send:
	 >{  
       	"EmployeeID" : "sam121",  
       	"changes" : {  
       	"Password" : "newPass",  
       	"MobileNo" : 9757401228  
       	}  
       }
     
 - Send the payload to **http://localhost:2000/update/employee** (might change on how the project is hosted)
	 
 - Response should be something like:
 ```
 {
     "request": "DB_EMPLOYEE_UPDATE",
     "result": "RESULT_OK",
     "message": {
         "n": 1,
         "nModified": 1,
         "ok": 1
     }
 }
 ```
- The following values are to be noted:
    - `request` : `DB_EMPLOYEE_UPDATE`
    - `result` : `RESULT_OK`

### Possible other results

- Status code 200  
    - `result` : `RESULT_OK` - The employee details were updated. 
- Status code 409  
    - `result` : `RESULT_DUPLICATE_ID` - Occurs if `EmployeeID` is changed under `changes`, and the id is already taken by someone else.  
- Status code 400
    - `result` : `RESULT_BAD_DATA` - An expected value was not present in the JSON body. See the `message` field for details.
- Status code 500
    - `result` : `RESULT_ERROR` - Error occurred. Check if `mongod` server is running.