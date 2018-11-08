import { connect, NVarChar, close } from 'mssql'; // MS Sql Server client
import { dbConfig } from '../../../settings';

import { ModuleOneLink } from '../module_type';

export {
    ServiceGetMenuByUserID,
    ServiceGetScreenById,
    ServiceGetModifyData
}

async function ServiceGetMenuByUserID(userid) {
    let result
    try {
        const querysql = `SELECT C.SCREEN_ID ,
                                C.MODULE ,
                                C.SCREEN_NAME
                        FROM   USERS U 
                                JOIN USER_MAP_ROLE M 
                                ON U.USER_ID = M.USER_ID 
                                JOIN SCREEN_MAP_ROLE S 
                                ON M.ROLE_ID = S.ROLE_ID 
                                JOIN SCREEN C 
                                ON S.SCREEN_ID = C.SCREEN_ID 
                                JOIN ROLE R 
                                ON M.ROLE_ID = R.ROLE_ID 
                        WHERE  U.USER_ID = @input_USER_ID 
                                AND U.RECORD_STATUS = 'Y' 
                                AND C.RECORD_STATUS = 'Y' 
                                AND R.RECORD_STATUS = 'Y' 
                        ORDER  BY S.SCREEN_ID ASC; `
        // input parameter       
        const input_USER_ID = 'input_USER_ID'
        //    
        let pool = await connect(dbConfig)

        result = await pool.request()
            // set parameter
            .input(input_USER_ID, NVarChar, userid.trim())
            .query(querysql)
        await close()

    } catch (err) {
    }
    return await result
}

async function ServiceGetScreenById(screen_id) {
    let res = {}
    try {
        const querysql = `SELECT SCREEN_NAME
                                ,MODULE
                            FROM SCREEN WHERE SCREEN_ID = @input_SCREEN_ID`
        // input parameter           
        const input_SCREEN_ID = 'input_SCREEN_ID'
        //    
        let pool = await connect(dbConfig)

        let result = await pool.request()
            // set parameter
            .input(input_SCREEN_ID, NVarChar, screen_id.trim())
            .query(querysql)

        if (result.rowsAffected > 0) {
            res = result.recordset[0]
        } else {
            res = { SCREEN_NAME: `${screen_id}`, MODULE: `${ModuleOneLink}` }
        }
    } catch (err) {
        //400 Bad Request
        res.sendStatus(500)
    } finally {
        await close()
    }

    return await res
}

async function ServiceGetModifyData(prm) {
    let res
    try {
        const querysql = `SELECT  C.SCREEN_NAME,S.V_ADD,S.V_EDIT,S.V_DELETE
                            FROM   USERS U 
                                INNER JOIN USER_MAP_ROLE M 
                                ON U.USER_ID = M.USER_ID 
                                INNER JOIN SCREEN_MAP_ROLE S 
                                ON M.ROLE_ID = S.ROLE_ID 
                                INNER JOIN SCREEN C 
                                ON S.SCREEN_ID = C.SCREEN_ID 
                            WHERE  U.USER_ID = @input_USER_ID
                                AND S.SCREEN_ID = @input_SCREEN_ID `
        // input parameter           
        const input_USER_ID = 'input_USER_ID'
        const input_SCREEN_ID = 'input_SCREEN_ID'

        let pool = await connect(dbConfig)

        let result = await pool.request()
            // set parameter
            .input(input_USER_ID, NVarChar, prm.user_id.trim())
            .input(input_SCREEN_ID, NVarChar, prm.screen_id.trim())
            .query(querysql)

        if (result.rowsAffected > 0) {
            res = result.recordset[0]
        }
    } catch (err) {
        //400 Bad Request
        res.sendStatus(500)
    } finally {
        await close()
    }

    return await res
}


