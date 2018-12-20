import { connect, close, NVarChar, Int, Date } from 'mssql'; // MS Sql Server client
import { dbConfig } from '../../../settings'
import db from '../db'

export {
    ServiceGetLogSDC
}

async function ServiceGetLogSDC(prm) {
    let res
    try {
        const querysql = `SELECT CONVERT(varchar, a.audit_date , 120) AS 'Date Time',
                                u.first_name + ' ' + u.last_name AS 'User', 
                                a.screen_name                    AS 'Menu',
                                t.action_type                    AS 'Type',  
                                REPLACE(REPLACE(a.new_value,'"',''),',','\n')  AS 'New Data', 
                                REPLACE(REPLACE(a.original_value,'"',''),',','\n')  AS 'Old Data'
                        FROM   log_audit_trail t 
                                JOIN log_audit a 
                                ON t.audit_trail_id = a.audit_trail_id 
                                JOIN users u 
                                ON a.user_id = u.user_id 
                        WHERE  t.module = 'SDC' 
                                AND a.status = 'S'
                                AND DATEADD(dd, DATEDIFF(dd, 0, a.AUDIT_DATE), 0) between @input_datefrom and @input_dateto
                        ORDER  BY a.audit_date DESC`        
     
        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'      

        const pool = await db.poolPromise
        let result = await pool.request()     
        await result.input(input_datefrom, NVarChar, prm.datefrom)
        await result.input(input_dateto, NVarChar, prm.dateto)       
        res = await result.query(querysql)
    } catch (err) {
    } finally {
        // await close()
    }
    return res
}