const sql = require('mssql');
const configs = require('./configs');

const config = 
{  
    user: configs.databaseUser,  
    password: configs.databasePassword,  
    server: configs.databaseServer,  
    database: configs.databaseName,
    pool: {
        max: configs.poolMax,
        min: configs.poolMin,
        idleTimeoutMillis: configs.poolIdleTimeout
    },
    options: {
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
}

const poolPromise = new sql.ConnectionPool(config)  
    .connect()  
    .then(pool => {  
        console.log(`Kết nối SQL Server ${configs.databaseServer} thành công\n`) ;
        return pool;
    })  
    .catch(error => console.log(`Kết nối SQL server ${configs.databaseServer} không thành công => ${error}\n`));
    
module.exports = {  
    sql, poolPromise  
}