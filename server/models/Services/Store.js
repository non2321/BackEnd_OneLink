const sql = require('mssql') // MS Sql Server client
const uuid = require('uuid/v1');

const settings = require('../../../settings')
const digit = require('../digit_number')
const utils = require('../../models/Services/utils')

// Store Config
module.exports.GetAllStore = GetAllStore
module.exports.GetVendor = GetVendor
module.exports.GetRegion = GetRegion
module.exports.GetAllBank = GetAllBank
module.exports.GetStoreConfig = GetStoreConfig
module.exports.GetPopupStore = GetPopupStore
module.exports.GetDropDownBank = GetDropDownBank
module.exports.GetStoreConfigByStoreCode = GetStoreConfigByStoreCode
module.exports.InsertStoreConfig = InsertStoreConfig
module.exports.EditStoreConfig = EditStoreConfig
module.exports.DeleteStoreConfig = DeleteStoreConfig

async function GetAllStore() {
    let res = {}
    try {
        let querysql = `SELECT STORE_ID, CAST(STORE_ID AS VARCHAR) + ' - ' + STORE_NAME AS STORE_NAME 
        FROM PH_STORES 
        WHERE COMPANY = 'Y' 
        ORDER BY STORE_ID ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetVendor() {
    let res = {}
    try {
        let querysql = `SELECT * FROM  ACC_M_VENDORS ORDER BY VENDOR ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetRegion() {
    let res = {}
    try {
        let querysql = `SELECT * FROM REGION_MASTER ORDER BY REGION_ID ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetAllBank() {
    let res = {}
    try {
        let querysql = `SELECT B.BANK_CODE,B.BANK_CODE + ' ' + B.BANK_NAME as BANK 
        FROM ACC_M_STORE S INNER JOIN ACC_M_BANK B ON S.BANK_CODE = B.BANK_CODE 
        ORDER BY B.BANK_CODE ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetStoreConfig() {
    let res = {}
    try {
        let querysql = ` SELECT A.STORE_CODE,
                            A.BANK_CODE,
                            CAST(A.STORE_CODE AS VARCHAR) + ' - ' + C.STORE_NAME AS STORE, 
                            B.BANK_NAME, 
                            B.BANK_BRANCH 
                    FROM   ACC_M_STORE A 
                            INNER JOIN ACC_M_BANK B 
                                    ON A.BANK_CODE = B.BANK_CODE 
                            INNER JOIN PH_STORES C 
                                    ON A.STORE_CODE = C.STORE_ID
                    ORDER  BY A.STORE_CODE`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetPopupStore() {
    let res = {}
    try {
        let querysql = ` SELECT STORE_ID,STORE_NAME 
                                FROM PH_STORES S
                                WHERE NOT EXISTS (SELECT * 
                                FROM   ACC_M_STORE A 
                                WHERE  A.STORE_CODE = S.STORE_ID)`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetDropDownBank() {
    let res = {}
    try {
        let querysql = ` SELECT B.BANK_CODE, 
                                RTRIM(B.BANK_NAME) + ' - ' + B.BANK_BRANCH AS BANK_NAME
                        FROM   ACC_M_BANK B 
                        ORDER  BY B.BANK_CODE ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetStoreConfigByStoreCode(store_code) {
    let res = {}
    try {  
        let querysql = `SELECT * FROM  ACC_M_STORE  WHERE  STORE_CODE = @input_store_code ` 
        const input_store_code = 'input_store_code'
        let pool = await sql.connect(settings.dbConfig)      
        let result = await pool.request().input(input_store_code, sql.NVarChar, store_code.trim()).query(querysql) 
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }  

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}

async function InsertStoreConfig(prm) {
    let res 
    try {
        if (prm.store_code) {
            const querysql = `
            INSERT INTO ACC_M_STORE 
                (STORE_CODE, 
                CO_CODE, 
                BANK_CODE, 
                AREA_CODE,
                DM_CODE,
                CREATE_DATE, 
                CREATE_BY) 
    VALUES     (@input_store_code, 
                @input_co_code, 
                @input_bank_code, 
                @input_area_code, 
                @input_dm_code,
                @input_create_date,
                @input_create_by)`

            const input_store_code = 'input_store_code'
            const input_co_code = 'input_co_code'
            const input_bank_code = 'input_bank_code'
            const input_area_code = 'input_area_code'
            const input_dm_code = 'input_dm_code'
            const input_create_date = 'input_create_date'           
            const input_create_by = 'input_create_by'           

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_store_code, sql.NVarChar, prm.store_code.trim())
                .input(input_co_code, sql.NVarChar, (prm.co_code != undefined) ? prm.co_code.trim() : '')
                .input(input_bank_code, sql.NVarChar, (prm.bank_code != undefined) ? prm.bank_code.trim() : '')
                .input(input_area_code, sql.NVarChar, (prm.area_code != undefined) ? prm.area_code.trim() : '')
                .input(input_dm_code, sql.NVarChar, (prm.dm_code != undefined) ? prm.dm_code.trim() : '')
                .input(input_create_date, sql.NVarChar, (prm.create_date != undefined) ? prm.create_date : '')               
                .input(input_create_by, sql.NVarChar, (prm.create_by != undefined) ? prm.create_by.trim() : '')
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res

}

async function EditStoreConfig(prm) {
    let res
    try {
        if (prm.store_code) {
            let querysql = `UPDATE ACC_M_STORE  SET STORE_CODE=STORE_CODE `

            if (prm.co_code != undefined) querysql = [querysql, `CO_CODE = @input_co_code `].join(",")
            if (prm.bank_code != undefined) querysql = [querysql, `BANK_CODE = @input_bank_code `].join(",")
            if (prm.area_code != undefined) querysql = [querysql, `AREA_CODE = @input_area_code `].join(",") 
            if (prm.dm_code != undefined) querysql = [querysql, `DM_CODE = @input_dm_code `].join(",")             
            if (prm.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prm.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")

            querysql += ` WHERE STORE_CODE = @input_store_code `
           
            const input_store_code = 'input_store_code'
            const input_co_code = 'input_co_code'
            const input_bank_code = 'input_bank_code'
            const input_area_code = 'input_area_code'          
            const input_dm_code = 'input_dm_code'         
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()

            if (prm.store_code != undefined) await result.input(input_store_code, sql.NVarChar, prm.store_code.trim())
            if (prm.co_code != undefined) await result.input(input_co_code, sql.NVarChar, prm.co_code.trim())
            if (prm.bank_code != undefined) await result.input(input_bank_code, sql.NVarChar, prm.bank_code.trim())
            if (prm.area_code != undefined) await result.input(input_area_code, sql.NVarChar, prm.area_code.trim()) 
            if (prm.dm_code != undefined) await result.input(input_dm_code, sql.NVarChar, prm.dm_code.trim()) 
            if (prm.update_date != undefined) await result.input(input_update_date, sql.NVarChar, prm.update_date.trim())
            if (prm.update_by != undefined) await result.input(input_update_by, sql.NVarChar, prm.update_by.trim())
            result = await result.query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        await sql.close()
    }
    return await res
}

async function DeleteStoreConfig(store_code) {
    let res
    try {    
        if (store_code) {          
            let querysql = `DELETE ACC_M_STORE  WHERE STORE_CODE =  @input_store_code `   
           
            const input_store_code = 'input_store_code'  

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
            .input(input_store_code, sql.NVarChar, store_code.trim())           
            .query(querysql)            
            
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}

