import { connect, close, NVarChar, Int, Date } from 'mssql'; // MS Sql Server client
import db from '../db'
import uuid from 'uuid/v1'
import { dbConfig } from '../../../settings'

export {
    ServiceGetImpProcessById,
    ServiceGetFileTypeSDCInterfaceActive,
    ServiceInsertImpProcess,
    ServiceInsertImpData,
    ServiceInsertImpRow,    
    ServiceCheckImpDataStatus,
    ServiceUpdateEndProcess,

    ServiceGenInterFaceSql,
    ServiceGenInterFaceInvSql
}

async function ServiceGetImpProcessById(uid) {
    let res
    try {       
        const querysql = `SELECT * 
                    FROM   imp_process 
                    WHERE  process_id = '${uid}'`

        let pool = await connect(dbConfig)

        let result = await pool.request()
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }
    } catch (err) {
        console.log(err)
    } finally {
        await close()
    }
    return await res
}

async function ServiceGetFileTypeSDCInterfaceActive() {
    let res
    try {
        const querysql = `SELECT file_type_id, 
                                file_type
                        FROM   imp_file_type 
                        WHERE  act_flag = 'Y' `

        let pool = await connect(dbConfig)

        let result = await pool.request().query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result.recordsets[0]
        }
    } catch (err) {
    } finally {
        await close()
    }
    return res
}

async function ServiceInsertImpProcess(prm) {
    let res
    try {
        const querysql = `INSERT INTO  IMP_PROCESS (
                PROCESS_ID,
                PROCESS_START,
                PROCESS_END,               
                PROCESS_STATUS,
                PROCESS_MESSAGE,
                PROCESS_STORE,
                PROCESS_DATA_DATE) 
     VALUES (   @input_process_id,
                @input_process_start,
                @input_process_end,
                @input_process_status,
                @input_message,
                @input_store,
                @input_data_date) `

        const input_process_id = 'input_process_id'
        const input_process_start = 'input_process_start'
        const input_process_end = 'input_process_end'
        const input_process_status = 'input_process_status'
        const input_message = 'input_message'
        const input_store = 'input_store'
        const input_data_date = 'input_data_date'

        let pool = await connect(dbConfig)
        const uid = uuid()
        let result = await pool.request()
            .input(input_process_id, NVarChar, uid)
            .input(input_process_start, NVarChar, prm.process_start)
            .input(input_process_end, NVarChar, prm.process_end)
            .input(input_process_status, NVarChar, prm.process_status)
            .input(input_message, NVarChar, prm.message)
            .input(input_store, NVarChar, prm.store)
            .input(input_data_date, NVarChar, prm.data_date)
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) {
                res = { uid: uid }
            }
        }
    } catch (err) {
        console.log(err)
    } finally {
        await close()
    }
    return await res
}

async function ServiceInsertImpData(prm) {
    let res
    try {
        const querysql = `INSERT INTO  IMP_DATA (
                DATA_ID,
                FILE_TYPE_ID,               
                FILE_NAME,
                IMP_DATA_START,
                IMP_DATA_END,
                IMP_DATA_STATUS,
                IMP_DATA_MESSAGE,
                PROCESS_ID) 
     VALUES (   @input_data_id,
                @input_filetype_id,
                @input_filename,
                @input_impdata_start,
                @input_impdata_end,
                @input_impdata_status,
                @input_impdata_message,
                @input_process_id) `

        const input_data_id = 'input_data_id'
        const input_filetype_id = 'input_filetype_id'
        const input_filename = 'input_filename'
        const input_impdata_start = 'input_impdata_start'
        const input_impdata_end = 'input_impdata_end'
        const input_impdata_status = 'input_impdata_status'
        const input_impdata_message = 'input_impdata_message'
        const input_process_id = 'input_process_id'

        let pool = await connect(dbConfig)
        const uid = uuid()
        let result = await pool.request()
            .input(input_data_id, NVarChar, uid)
            .input(input_filetype_id, NVarChar, prm.filetype_id)
            .input(input_filename, NVarChar, prm.filename)
            .input(input_impdata_start, NVarChar, prm.impdata_start)
            .input(input_impdata_end, NVarChar, prm.impdata_end)
            .input(input_impdata_status, NVarChar, prm.impdata_status)
            .input(input_impdata_message, NVarChar, prm.impdata_message)
            .input(input_process_id, NVarChar, prm.process_id)
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) {
                res = { uid: uid }
            }
        }
    } catch (err) {
        console.log(err)
    } finally {
        await close()
    }
    return await res
}

async function ServiceInsertImpRow(prm) {
    let res
    try {

        const querysql = `INSERT INTO  IMP_ROW (
                ROW_ID,
                C1,               
                C2,
                C3,               
                C4,
                C5,               
                C6,
                C7,               
                C8,
                C9,               
                C10,
                DATA_ID,
                ROW_STATUS,
                ROW_MESSAGE) 
     VALUES (   @input_row_id,
                @input_c1,
                @input_c2,
                @input_c3,
                @input_c4,
                @input_c5,
                @input_c6,
                @input_c7,
                @input_c8,
                @input_c9,
                @input_c10,
                @input_data_id,
                @input_row_status,
                @input_row_message) `

        const input_row_id = 'input_row_id'
        const input_c1 = 'input_c1'
        const input_c2 = 'input_c2'
        const input_c3 = 'input_c3'
        const input_c4 = 'input_c4'
        const input_c5 = 'input_c5'
        const input_c6 = 'input_c6'
        const input_c7 = 'input_c7'
        const input_c8 = 'input_c8'
        const input_c9 = 'input_c9'
        const input_c10 = 'input_c10'
        const input_data_id = 'input_data_id'
        const input_row_status = 'input_row_status'
        const input_row_message = 'input_row_message'

       
        // let pool = await connect(dbConfig)
        const uid = uuid()
        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_row_id, NVarChar, uid)
            .input(input_c1, NVarChar, (prm.C1 != undefined) ? prm.C1.trim() : null)
            .input(input_c2, NVarChar, (prm.C2 != undefined) ? prm.C2.trim() : null)
            .input(input_c3, NVarChar, (prm.C3 != undefined) ? prm.C3.trim() : null)
            .input(input_c4, NVarChar, (prm.C4 != undefined) ? prm.C4.trim() : null)
            .input(input_c5, NVarChar, (prm.C5 != undefined) ? prm.C5.trim() : null)
            .input(input_c6, NVarChar, (prm.C6 != undefined) ? prm.C6.trim() : null)
            .input(input_c7, NVarChar, (prm.C7 != undefined) ? prm.C7.trim() : null)
            .input(input_c8, NVarChar, (prm.C8 != undefined) ? prm.C8.trim() : null)
            .input(input_c9, NVarChar, (prm.C9 != undefined) ? prm.C9.trim() : null)
            .input(input_c10, NVarChar, (prm.C10 != undefined) ? prm.C10.trim() : null)
            .input(input_data_id, NVarChar, prm.data_id)
            .input(input_row_status, NVarChar, prm.row_status)
            .input(input_row_message, NVarChar, prm.row_message)
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) {
                res = { uid: uid }
            }
        }
    } catch (err) {
        console.log(err)
    } finally {
        // await close()
    }
    return await res
}

async function ServiceCheckImpDataStatus(uid) {
    let res
    try {       
        const querysql = `SELECT * 
                    FROM   imp_data 
                    WHERE  process_id = '${uid}'`

        let pool = await connect(dbConfig)

        let result = await pool.request()
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }
    } catch (err) {
        console.log(err)
    } finally {
        await close()
    }
    return await res
}

async function ServiceUpdateEndProcess(prm) {
    let res
    try {
        const querysql = `UPDATE imp_process 
                        SET    process_end = '${prm.process_end}' , 
                            process_status = '${prm.process_status}' 
                        WHERE  process_id = '${prm.process_id}' `

        // const input_process_end = '@input_process_end'
        // const input_process_status = '@input_process_status'
        // const input_process_id = '@input_process_id'

        let pool = await connect(dbConfig)
        let result = await pool.request()
            // .input(input_process_end, NVarChar, prm.process_end)
            // .input(input_process_status, NVarChar, prm.process_status)
            // .input(input_process_id, NVarChar, prm.process_id)
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) {
                res = result.recordset
            }
        }
    } catch (err) {
        console.log(err)
    } finally {
        await close()
    }
    return await res
}

//GenInterFaceSql
async function ServiceGenInterFaceSql(prm) {
    let res

    try {
        if (prm) {
            const p_process_id = 'p_process_id'

            let pool = await connect(dbConfig)
            let result = await pool.request()
                .input(p_process_id, NVarChar, prm.process_id)
                .execute('GEN_INTERFACE_SQL')
            if (result !== undefined) {
                res = result.recordset
            }
        }
    } catch (err) {
        console.log(err)
    } finally {
        await close()
    }
    return await res
}

//GenInterFaceInvSql
async function ServiceGenInterFaceInvSql(prm) {
    let res

    try {
        if (prm) {
            const p_process_id = 'p_process_id'

            let pool = await connect(dbConfig)
            let result = await pool.request()
                .input(p_process_id, NVarChar, prm.process_id)
                .execute('GEN_INTERFACE_INV_SQL')
            if (result !== undefined) {
                res = result.recordset
            }
        }
    } catch (err) {

    } finally {
        await close()
    }
    return await res
}