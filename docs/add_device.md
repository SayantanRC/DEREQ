# Add a new device
#### (ADMIN ONLY)

A "device" specifies a hardware profile for which there are many "units" with the same specification.  
Example, we can have many Google Pixel devices, and many Samsung Galaxy S8 devices.
The "Google Pixel" hardware has a `DeviceID` say "GP1", where as all Google Pixel "units" have `UnitID`s say "GP1_1", "GP1_2" etc.  
Similarly, "Samsung Galaxy S8", as a hardware may have `DeviceID` say "SGS8", and its units may be "SGS8_1", "SGS8_2" etc.
   
 - In the payload, send:
	 >{  
       	"DeviceID": "GP1",  
        "DeviceType": "mobile",  
        "DeviceName": "Google Pixel",  
        "Make": "Google",  
        "Model": "",  
        "RAM": "3 GB",  
        "Storage": "256 GB",  
        "OS": "Android",  
        "OSVersion": "Android 8.1 Oreo",  
        "Accessories": [  
            "charger"  
        ],  
        "AccessoryAvailabilityStatus": "available",  
        "Comments": ""  
      }  
     
 - Send the payload to **http://localhost:2000/add/device** (might change on how the project is hosted)
	 
 - Response should be something like:
 ```
 {
     "request": "DB_DEVICE_CREATE",
     "result": "RESULT_OK",
     "message": {
         "result": {
             "ok": 1,
             "n": 1
         },
         "ops": [
             {
                 "DeviceID": "GP1",
                 "DeviceType": "mobile",
                 "DeviceName": "Google Pixel",
                 "Make": "Google",
                 "Model": "",
                 "RAM": "3 GB",
                 "Storage": "256 GB",
                 "OS": "Android",
                 "OSVersion": "Android 8.1 Oreo",
                 "Accessories": [
                     "charger"
                 ],
                 "AccessoryAvailabilityStatus": "available",
                 "Comments": "",
                 "_id": "5b41f4f55a3b473cd7db46bf"
             }
         ],
         "insertedCount": 1,
         "insertedIds": {
             "0": "5b41f4f55a3b473cd7db46bf"
         }
     }
 }
 ```
- The following values are to be noted:
    - `request` : `DB_DEVICE_CREATE`
    - `result` : `RESULT_OK`

### Possible other results

- Status code 200  
    - `result` : `RESULT_OK` - The device with the given values have been inserted in the database. 
- Status code 409  
    - `result` : `RESULT_DUPLICATE_ID` - A device with the given `DeviceID` is already present. This value needs to be changed  
- Status code 400
    - `result` : `RESULT_BAD_DATA` - An expected value was not present in the JSON body, like `OS` or say `Accessories` is not an array. See the `message` field for details.
- Status code 500
    - `result` : `RESULT_ERROR` - Error occurred. Check if `mongod` server is running.