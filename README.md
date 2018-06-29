# DEREQ - Device Enquery and Requisition

This is a Node JS based app for performing various types device status enquery and requisition of them.  
This is a prototype... long way to finish...  


### USAGE:

Install Postman : https://www.getpostman.com/apps

##### Initialise the db

1. Open Postman
2. Run this file
3. Top left corner, Select dropdown and click <b>GET<b/> (other options are POST, PUT, DELETE etc.)
4. In the <b>Enter request url<b/>, enter : http://localhost:2000/
5. Press enter

##### Close the db

1. In the <b>"Enter request url"</b>, enter : http://localhost:2000/close
2. Press enter

##### Reopen db

In the <b>"Enter request url"<b/>, enter : http://localhost:2000/open

##### Add a device

1. Top left corner, Select dropdown and click <b>POST<b/> instead of GET
2. Below the url bar, open the <b>Body"<b/>
3. Select <b>raw<b/> radiobutton
4. Click on the dropdown "Text" and select "JSON(application/json)"
5. In the text box enter
> {
> "DeviceID" : "M203",
> "DeviceName" : "Motorola Moto X4",
> "ScreenSize" : 5.2,
> "WaterResistance" : true
> }
6. In the <b>Enter request url<b/>, enter : http://localhost:2000/add/devce
7. Press Enter/Send

Other devices can be similarly added

* 5. To query all devices
*
* Top left corner, Select dropdown and click GET
* In the "Enter request url", enter : http://localhost:2000/query/device_collection/
* Press Enter/Send
*
* 6. To query with condition
*
* Top left corner, Select dropdown and click GET
* In the "Enter request url", enter : http://localhost:2000/query/device_collection/{"ScreenSize" : 5.2}
* Press Enter/Send
* lists all devices having screen size 5.2 inch
*
* 7. To update a device
*
* Top left corner, Select dropdown and click PUT
* In the "Enter request url", enter : http://localhost:2000/updateDevice
* In the text box, enter: (DeviceID must be entered)
    {
	"DeviceID" : "M203",
	"OS" : "Android 8.0",
	"Battery" : "3000 mAh"
    }
* press Enter/Send
*
* 8. To delete a device
*
* Top left corner, Select dropdown and click DELETE
* In the "Enter request url", enter : http://localhost:2000/deleteDevice
* In the text box, enter: (only DeviceID must be entered, nothing else)
    {
	"DeviceID" : "M203"
    }
* press Enter/Send
