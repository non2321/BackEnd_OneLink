const sql = require('mssql') // MS Sql Server client
const uuid = require('uuid/v1');
const settings = require('../../../settings')
const utils = require('./utils')

module.exports.InsertLogAuditTrail = InsertLogAuditTrail;
module.exports.InsertLogAudit = InsertLogAudit;

async function InsertLogAuditTrail(prm) {
    let res 
    try {
        const querysql = `INSERT INTO  LOG_AUDIT_TRAIL (
                AUDIT_TRAIL_ID, 
                AUDIT_TRAIL_DATE,
                MODULE,
                SCREEN_NAME,
                ACTION_TYPE,
                STATUS,
                USER_ID,
                CLIENT_IP,
                AUDIT_TRAIL_MSG,
                BROWSER) 
     VALUES (   @input_audit_trail_id,
                @input_audit_trail_date,
                @input_module,
                @input_screen_name,
                @input_action_type,
                @input_status,
                @input_user_id,
                @input_client_ip,
                @input_audit_trail_msg,
                @input_browser ) `

        const input_audit_trail_id = 'input_audit_trail_id'
        const input_audit_trail_date = 'input_audit_trail_date'
        const input_module = 'input_module'
        const input_screen_name = 'input_screen_name'
        const input_action_type = 'input_action_type'
        const input_status = 'input_status'
        const input_user_id = 'input_user_id'
        const input_client_ip = 'input_client_ip'
        const input_audit_trail_msg = 'input_audit_trail_msg'
        const input_browser = 'input_browser'

        let pool = await sql.connect(settings.dbConfig)
        const uid = uuid();
        let result = await pool.request()
            .input(input_audit_trail_id, sql.NVarChar, uid)
            .input(input_audit_trail_date, sql.NVarChar, prm.audit_trail_date)
            .input(input_module, sql.NVarChar, prm.module)
            .input(input_screen_name, sql.NVarChar, prm.screen_name)
            .input(input_action_type, sql.NVarChar, prm.action_type)
            .input(input_status, sql.Char(1), prm.status)
            .input(input_user_id, sql.NVarChar, prm.user_id)
            .input(input_client_ip, sql.NVarChar, prm.client_ip.replace('::ffff:', ''))
            .input(input_audit_trail_msg, sql.NVarChar, prm.msg)
            .input(input_browser, sql.NVarChar, prm.browser)
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) {
                res = { uid: uid }
            } else {
                //400 Bad Request

            }
        }
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}


async function InsertLogAudit(prm) {
    try { 
        const querysql = `INSERT INTO  LOG_AUDIT (
                AUDIT_ID, 
                AUDIT_DATE,
                ACTION_TYPE,
                USER_ID,
                SCREEN_NAME,
                CLIENT_IP,
                STATUS,
                AUDIT_MSG,
                AUDIT_TRAIL_ID,
                NEW_VALUE,
                ORIGINAL_VALUE) 
     VALUES (   @input_audit_id,
                @input_audit_date,
                @input_action_type,
                @input_user_id,
                @input_screen_name,
                @input_client_ip,
                @input_status,
                @input_audit_msg,
                @input_audit_trail_id,
                @input_new_value,
                @input_original_value ) `

        const input_audit_id = 'input_audit_id'
        const input_audit_date = 'input_audit_date'
        const input_action_type = 'input_action_type'
        const input_user_id = 'input_user_id'
        const input_screen_name = 'input_screen_name'
        const input_client_ip = 'input_client_ip'
        const input_status = 'input_status'
        const input_audit_msg = 'input_audit_msg'
        const input_audit_trail_id = 'input_audit_trail_id'
        const input_new_value = 'input_new_value'
        const input_original_value = 'input_original_value'
       
        let pool = await sql.connect(settings.dbConfig)
        const uid = uuid();
        let result = await pool.request()
            .input(input_audit_id, sql.NVarChar, uid)
            .input(input_audit_date, sql.NVarChar, prm.audit_date)
            .input(input_action_type, sql.NVarChar, prm.action_type)
            .input(input_user_id, sql.NVarChar, prm.user_id)
            .input(input_screen_name, sql.NVarChar, prm.screen_name)
            .input(input_client_ip, sql.NVarChar, prm.client_ip.replace('::ffff:', ''))
            .input(input_status, sql.NVarChar, prm.status)
            .input(input_audit_msg, sql.NVarChar, prm.audit_msg)
            .input(input_audit_trail_id, sql.NVarChar, prm.audit_trail_id)
            .input(input_new_value, sql.NVarChar, await utils.ObjectToString_UpperName(prm.new_value))
            .input(input_original_value, sql.NVarChar, await utils.ObjectToString_UpperName((prm.original_value != undefined)? prm.original_value[0] : undefined))
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) {
            }
        }
    } catch (err) {
    } finally {
        await sql.close()
    }
}

