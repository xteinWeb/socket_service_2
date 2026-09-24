import Mssql from 'mssql';
import * as ssql from '../database/mssql-connection-pooling';

const dbSettings = {
    user: 'sa',
    password: 'sql2025SEadmin',
    server: '192.168.11.153',
    database: 'XTEIN',
    port: 988,
    trustServerCertificate: true,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 60000
    }
};

export async function getConnection(){ 
    try {        
        let pool = await ssql.GetCreateIfNotExistPool(dbSettings);

        console.log('-----------------------');
        console.log('CONECTADO A DB XTEIN');
        console.log('-----------------------');
        return pool;
        
    } catch (error) {
        console.log('Error conexion:',error);  
        return null;    
    }
};

export { ssql, Mssql };
