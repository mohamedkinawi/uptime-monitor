require('dotenv').config();
const express = require('express');
const app = express();

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://mkinawi:'+process.env.DB_PASS+'@cluster0.apfmr.mongodb.net/uptime-monitor-db?retryWrites=true&w=majority');

mongoose.connection.on('connected', function(){
    console.log("Mongoose default connection is open");
});

mongoose.connection.on('error', function(err){
    console.log("Mongoose default connection has occured "+err);
});

mongoose.connection.on('disconnected', function(){
    console.log("Mongoose default connection is disconnected");
});

process.on('SIGINT', function(){
    mongoose.connection.close(function(){
        console.log("Mongoose default connection is disconnected due to application termination");
        process.exit(0);
    });
});

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const appMiddleware = require('./app-middleware');
const checkRoutes = require('./api/routes/check');
const reportRoutes = require('./api/routes/report');
const userRoutes = require('./api/routes/user/user');

app.use(appMiddleware.browsers);
app.use('/check',checkRoutes);
app.use('/report',reportRoutes);
app.use('/user',userRoutes);
app.use(appMiddleware.notFound);

module.exports = app;