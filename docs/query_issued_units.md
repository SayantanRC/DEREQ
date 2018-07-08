# Query issued units

An employee/user can register for multiple units. It can be great if those units are made visible to the user in the home page in a "dashboard".
   
 - In the payload, send:
	 >{  
       	"EmployeeRegistrationID" : "sam121"  
      }  
     
 - Send the payload to **http://localhost:2000/query/unit** (might change on how the project is hosted)
	 
 - Response should be something like:
 ```
 {
     "request": "DB_QUERY_COMPLETE",
     "result": "RESULT_OK",
     "message": [
         {
             "_id": "5b41afe650875c488adbe202",
             "DeviceID": "GP1",
             "UnitID": "GP1_2",
             "UnitCondition": "healthy",
             "EmployeeRegistrationID": "sam121"
         },
         {
             "_id": "5b41affb50875c488adbe204",
             "DeviceID": "IPX",
             "UnitID": "IPX_1",
             "UnitCondition": "healthy",
             "EmployeeRegistrationID": "sam121"
         }
     ]
 }
 ```
- The following values are to be noted:
    - `request` : `DB_QUERY_COMPLETE`
    - `result` : `RESULT_OK`
    - 3 units are registered under this `EmployeeID`
    - Note that these are "units" belonging to a "device" type. As such there is no `DeviceName` or other specifications.
    - The appropriate device specifications can be found by
        - iterating through the given array
        - extracting the `DeviceID` for each array item
        - passing a JSON query as `{"DeviceID" : <extracted_DeviceID>}` to **http://localhost:2000/query/device**

### Possible other results

- Status code 200  
    - `result` : `RESULT_OK` - The units for the given `EmployeeRegistrationID` was found and sent properly.   
- Status code 404  
    - `result` : `RESULT_NO_SUCH_DATA` - No units are registered with the given `EmployeeRegistrationID`.
- Status code 500
    - `result` : `RESULT_ERROR` - Error occurred. Check if `mongod` server is running.