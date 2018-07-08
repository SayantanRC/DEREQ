# DEREQ - Device Enquiry and Requisition

This is a Node JS based app for performing various types device status enquiry and requisition of them.  
This project is now in version 1.0  


### USAGE:

1. Install Postman : [Get postman](https://www.getpostman.com/apps)  
2. Run `Index.js`

#### Common for all operations

1. Top left corner in Postman, Select dropdown and click <b>POST</b>
2. Below the url bar, open the <b>Body</b>
3. Select <b>raw</b> radiobutton
4. Click on the dropdown <b>Text</b> and select <b>JSON(application/json)</b>

[Reference for token management](https://github.com/SayantanRC/DEREQ/blob/master/docs/login.md)

#### Add a new employee/user

In the text box below url, enter:
>{  
	"EmployeeName" : "Samir Ghosh",  
	"EmployeeID" : "sam121",  
	"Email" : "samirghosh95@gmail.com",  
	"MobileNo" : 9996454321,  
	"Password" : "samirg111",  
	"IsAdmin" : false  
}

In the <b>Enter request url</b>, enter : [http://localhost:2000/add/employee](http://localhost:2000/add/employee)  
Press <b>Send</b>

[Detailed reference](https://github.com/SayantanRC/DEREQ/blob/master/docs/add_employee.md)

#### Login to get a token

In the text box below url, enter:
>{    
	"EmployeeID" : "sam121",  
	"Password" : "samirg111"  
}

In the <b>Enter request url</b>, enter : [http://localhost:2000/login](http://localhost:2000/login)  
Press <b>Send</b>

[Detailed reference](https://github.com/SayantanRC/DEREQ/blob/master/docs/login.md)

#### Update data of an employee/user

In the text box below url, enter:
>{  
 	"EmployeeID" : "sam121",  
 	"changes" : {  
 	"Password" : "newPass",  
 	"MobileNo" : 9757401228  
 	}  
 }
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/update/employee](http://localhost:2000/update/employee)  
Press <b>Send</b>

[Detailed reference](https://github.com/SayantanRC/DEREQ/blob/master/docs/update_employee.md)

#### Delete an employee/user

In the text box below url, enter:
>{  
 	"EmployeeID" : "sam121"  
 }
 
`Only "EmployeeID" is allowed.`
 
In the <b>Enter request url</b>, enter : [http://localhost:2000/delete/employee](http://localhost:2000/delete/employee)  
Press <b>Send</b>

[Detailed reference](https://github.com/SayantanRC/DEREQ/blob/master/docs/delete_employee.md)

#### Add a device (ADMIN ONLY)

In the text box below url, enter:
>{  
 	"DeviceID" : "IPX",  
 	"DeviceType" : "mobile",  
 	"DeviceName" : "iPhone X",  
 	"Make" : "Apple",  
 	"Model" : "A1901",  
 	"RAM" : 3,  
 	"Storage" : 256,  
 	"OS" : "iOS",  
 	"OSVersion" : 11,  
 	"Accessories" : ["airpods", "charger"],  
 	"AccessoryAvailabilityStatus" : "available",  
 	"Comments" : ""  
}
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/add/device](http://localhost:2000/add/device)  
Press <b>Send</b>

Other devices can be similarly added

[Detailed reference](https://github.com/SayantanRC/DEREQ/blob/master/docs/add_device.md)

#### Update a device (ADMIN ONLY)

In the text box below url, enter:
>{  
      "DeviceID": "IPX",  
      "changes" :  
      {  
      	"DeviceID": "IP_X",  
      	"OSVersion" : 12,  
      	"WaterResistance" : true  
      }  
 }

`"DeviceID" is mandatory, any other fields to be added must be put inside "changes" : {}.`
```
Removal of already present (non-essential) fields: pass null as field value.  
Say in the above example, to remove "WaterResistance" field...  

{  
"DeviceID" : "IP_X",  
"changes" : { "WaterResitance" : null }    
}
```  
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/update/device](http://localhost:2000/update/device)  
Press <b>Send</b>

#### Query devices

In the text box below url, enter:
>{  
 	"RAM" : 3,  
 	"Storage" : 256  
 }
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/query/device](http://localhost:2000/query/device)  
Press <b>Send</b>

#### Delete a device (ADMIN ONLY)

In the text box below url, enter:

>{  
 	"DeviceID" : "IPX"  
 }
    
`Note: Only "DeviceID" is allowed to be placed for a delete requist, no other fields`  

In the <b>Enter request url</b>, enter : [http://localhost:2000/delete/device](http://localhost:2000/delete/device)  
Press <b>Send</b>  

#### Add a unit (ADMIN ONLY)

In the text box below url, enter:
>{  
 	"DeviceID" : "IP_X",  
 	"UnitID" : "IP_X_1",  
 	"UnitCondition" : "dead"  
 }
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/add/unit](http://localhost:2000/add/unit)  
Press <b>Send</b>

Other units can be similarly added

#### Update a unit (ADMIN ONLY)

In the text box below url, enter:
>{  
 	"UnitID" : "IP_X_1",  
 	"changes" : { "UnitCondition": "healthy" }  
 }
 
`"UnitID" is mandatory, "EmployeeRegistrationID" field cannot be updated from here. See below on how to issue or submit a unit.`
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/update/unit](http://localhost:2000/update/unit)  
Press <b>Send</b>

#### Query units
 
In the text box below url, enter:  
`Say we want to query all healthy iPhone X units which have not been issued to anyone`  
 
>{  
 	"DeviceID" : "IP_X",  
 	"EmployeeRegistrationID": "none",  
 	"UnitCondition" : "healthy"  
 }
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/query/unit](http://localhost:2000/query/unit)  
Press <b>Send</b>

#### Issue a unit

In the text box below url, enter:
>{  
 	"UnitID" : "IP_X_1",  
 	"EmployeeRegistrationID" : "sam121"  
 }
 
 `Only "UnitID" and a valid "EmployeeRegistrationID" (equal to "EmployeeID") is allowed.`
 
 In the <b>Enter request url</b>, enter : [http://localhost:2000/unit/issue](http://localhost:2000/unit/issue)  
 Press <b>Send</b>
 
 [How to see issued units for an employee](https://github.com/SayantanRC/DEREQ/blob/master/docs/query_issued_units.md)
 
 #### Submit a unit
 
 In the text box below url, enter:
 >{  
  	"UnitID": "IP_X_1"  
  }
 
 `Only "UnitID" is allowed.`
 
 In the <b>Enter request url</b>, enter : [http://localhost:2000/unit/submit](http://localhost:2000/unit/submit)  
 Press <b>Send</b>
 
 #### Delete a unit (ADMIN ONLY)
 
 In the text box below url, enter:
  >{  
   	"UnitID": "IP_X_1"  
   }
  
  `Only "UnitID" is allowed.`
  
  In the <b>Enter request url</b>, enter : [http://localhost:2000/delete/unit](http://localhost:2000/delete/unit)  
  Press <b>Send</b>
  
#### See logs - get all log data (ADMIN ONLY)

In the <b>Enter request url</b>, enter : [http://localhost:2000/log/get](http://localhost:2000/log/get)  
Press <b>Send</b>

#### Clear all logs (ADMIN ONLY)

In the <b>Enter request url</b>, enter : [http://localhost:2000/log/clear](http://localhost:2000/log/clear)  
Press <b>Send</b>