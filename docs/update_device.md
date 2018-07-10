# Update specifications of a device
#### (ADMIN ONLY)

Used to update specifications like RAM, Storage etc.
   
 - Say, we need to update the `Model` of a device. In the payload, send:
	 >{  
         "DeviceID": "GP1",  
         "changes" : {  
         "Model" : "G-2PW2200",  
         "Storage" : "64 GB"  
         }  
      }  
      
 - The alterations i.e. field values to be changed, must be put under a JSON object with key `changes`  
     
 - Send the payload to **http://localhost:2000/update/device** (might change on how the project is hosted)
	 
 - Response should be something like:
 ```
 {
     "request": "DB_DEVICE_UPDATE",
     "result": "RESULT_OK",
     "message": {
         "n": 1,
         "nModified": 1,
         "ok": 1
     }
 }
 ```
- The following values are to be noted:
    - `request` : `DB_DEVICE_UPDATE`
    - `result` : `RESULT_OK`

### Possible other results

- Status code 200  
    - `result` : `RESULT_OK` - The device details were updated. 
- Status code 409  
    - `result` : `RESULT_DUPLICATE_ID` - Occurs if `DeviceID` is changed under `changes`, and the id is already present.
- Status code 404
    - `result` : `RESULT_NO_SUCH_DATA` - The device with the given `DeviceID` does not exist.  
- Status code 400
    - `result` : `RESULT_BAD_DATA` - An expected value was not present in the JSON body. See the `message` field for details.
- Status code 500
    - `result` : `RESULT_ERROR` - Error occurred. Check if `mongod` server is running.