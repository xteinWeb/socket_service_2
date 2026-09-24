import Mssql from 'mssql';
import express from "express";
import * as ssql from '../database/mssql-connection-pooling';
import fs from 'fs';

const app = express();

export async function getConnectionEmpresa(client_id: any, accion: string = '') {

    try {
        // var fs = require('fs');
        var obj = JSON.parse(fs.readFileSync('./src/databaseSetting.json', 'utf8'));
        const config = obj[client_id];
        let pool = await ssql.GetCreateIfNotExistPool(config);
        //const pool = await sql.connect(config);
        console.log('---------------------------------------------------------------------');
        console.log('CONECTADO A DB ' + client_id + ' ' + accion + ' ' + config.database);
        console.log('---------------------------------------------------------------------');

        return pool;

    } catch (error) {
        console.log('ERROR:: ' + error);
        console.error('--- ERROR CRÍTICO EN CONEXIÓN ---');
        console.error('ID CLIENTE:', client_id);
        console.error('DETALLE:', error);
        return null; // Retornamos null explícitamente
    }
}

export { ssql, Mssql };
