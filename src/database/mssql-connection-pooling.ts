import pkg from 'mssql';

const { ConnectionPool } = pkg;
let pools:any = {}

// create a new connection pool
export function CreatePool(config: any) {
    let key = JSON.stringify(config)

    if (GetPool(key))
        throw new Error('Pool ya existe')

    pools[key] = (new ConnectionPool(config)).connect()
    return pools[key]
}

// get a connection pool from all pools
export function GetPool(name:any) {
    if (pools[name])
        return pools[name]
    else
        return null
}

// if pool already exists, return it, otherwise create it
export function GetCreateIfNotExistPool(config:any) {
    let key = JSON.stringify(config)

    let pool = GetPool(key)
    if (pool)
        return pool
    else
        return CreatePool(config)
}

// close a single pool
export function ClosePool(config:any) {
    let key = JSON.stringify(config)

    if (pools[key]) {
        const pool = pools[key];
        delete pools[key];
        pool.close()
        return true
    }
    return false
}

// close all the pools
export function CloseAllPools() {
    pools.forEach((pool:any) => {
        pool.close()
    })
    pools = {}
    return true
}