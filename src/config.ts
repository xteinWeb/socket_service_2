import { config } from "dotenv";  //leera las variables de entorno
import express from 'express';
// import cors from 'cors';
import bodyParser from  'body-parser';
import * as path from 'path';

config({ path: path.join(__dirname, '../.env') });
var app = express();

// app.use( cors() );

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));

//exportacion del puerto en variable de entorno
export default {
    port : process.env.PORT
}
