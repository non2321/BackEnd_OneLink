import sql from 'mssql'
import { dbConfig } from '../../settings'

const poolPromise = new sql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connected to MSSQL')
        return pool
    })
    .catch(err => console.log('Database Connection Failed! Bad Config: ', err))

export  default {
    sql, poolPromise
}