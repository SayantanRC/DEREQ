
//dependencies

const express = require('express');
const app = express();
const router = require('./DEREQ_router');

//setting the port to listen to
//use 2000 if process.env.APP_PORT is not specified
const appPort = process.env.APP_PORT || 2000;

//setting the router from DEREQ_router.js
app.use('/', router);

//start listening to the port specified
app.listen(appPort, () => {
    console.log(`Listening at port ${appPort}...`);
});