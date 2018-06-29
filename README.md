# DEREQ - Device Enquery and Requisition

This is a Node JS based app for performing various types device status enquery and requisition of them.  
This is a prototype... long way to finish...  


### USAGE:

Install Postman : https://www.getpostman.com/apps

#### Initialise the db

1. Open Postman
2. Run this file
3. Top left corner, Select dropdown and click <b>GET</b> (other options are POST, PUT, DELETE etc.)
4. In the <b>Enter request url</b>, enter : http://localhost:2000/
5. Press enter

#### Close the db

1. In the <b>"Enter request url"</b>, enter : http://localhost:2000/close
2. Press enter

#### Reopen db

In the <b>"Enter request url"</b>, enter : http://localhost:2000/open

#### Add a device

1. Top left corner, Select dropdown and click <b>POST</b> instead of GET
2. Below the url bar, open the <b>Body"</b>
3. Select <b>raw</b> radiobutton
4. Click on the dropdown "Text" and select "JSON(application/json)"
5. In the text box enter
> {
> "DeviceID" : "M203",  
> "DeviceName" : "Motorola Moto X4",  
> "ScreenSize" : 5.2,  
> "WaterResistance" : true  
> }
6. In the <b>Enter request url</b>, enter : http://localhost:2000/add/devce
7. Press Enter/Send

Other devices can be similarly added
