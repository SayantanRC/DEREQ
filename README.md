# DEREQ - Device Enquery and Requisition

This is a Node JS based app for performing various types device status enquery and requisition of them.  
This is a prototype... long way to finish...  


### USAGE:

Install Postman : [Get postman](https://www.getpostman.com/apps)

#### Common for all operations

1. Top left corner in Postman, Select dropdown and click <b>POST</b>
2. Below the url bar, open the <b>Body</b>
3. Select <b>raw</b> radiobutton
4. Click on the dropdown <b>Text</b> and select <b>JSON(application/json)</b>

#### Add a device

In the text box below url, enter:
> {  
>"DeviceID" : "M203",  
>"DeviceName" : "Motorola Moto X4",  
>"ScreenSize" : 5.2
>}
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/add/device](http://localhost:2000/add/device)
Press <b>Send</b>

Other devices can be similarly added

#### Delete a device

In the text box below url, enter:

>{    
>"DeviceID" : "M203"  
>}  
    
`Note: Only "DeviceID" is allowed to be placed for a delete requist, no other fields`  

In the <b>Enter request url</b>, enter : [http://localhost:2000/delete/device](http://localhost:2000/delete/device)  
Press <b>Send</b>  

#### Update a device

In the text box below url, enter:
> {  
>"DeviceID" : "M203",  
>"WaterResitance" : true
>}

```
"DeviceID" is mandatory, any other fields placed will either be added or changed from previous value.  
Removal of already present fields are not yet implemented, but will be available soon.  
```  
  
In the <b>Enter request url</b>, enter : [http://localhost:2000/update/device](http://localhost:2000/update/device)  
Press <b>Send</b>