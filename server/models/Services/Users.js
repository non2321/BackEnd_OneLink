const sql = require('mssql') // MS Sql Server client
const uuid = require('uuid/v1');

const settings = require('../../../settings')
const utils = require('../../models/Services/utils')

const digit = require('../../models/digit_number')

module.exports.InsertUsers = InsertUsers;
module.exports.GetUsersByUsername = GetUsersByUsername;

async function InsertUsers(prmUser) {
    try {
        let userid = utils.FormatNumberLength(await utils.GetCountUserId(), digit.User_ID)
        const querysql = `INSERT INTO  USERS 
        (USER_ID, FIRST_NAME, LAST_NAME, POSITION, EMAIL, MOBILE_NO, RECORD_STATUS, CREATE_DATE, CREATE_BY, PHC_USER) 
         VALUES ( @input_user_id, @input_first_name, @input_last_name, @input_position, @input_email, @input_mobile_no, @input_record_status, @input_create_date, @input_create_by, @input_phc_user ) `
        const input_user_id = 'input_user_id'
        const input_first_name = 'input_first_name'
        const input_last_name = 'input_last_name'
        const input_position = 'input_position'
        const input_email = 'input_email'
        const input_mobile_no = 'input_mobile_no'
        const input_record_status = 'input_record_status'
        const input_create_date = 'input_create_date'
        const input_create_by = 'input_create_by'
        const input_phc_user = 'input_phc_user'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_user_id, sql.NVarChar, userid.trim())
            .input(input_first_name, sql.NVarChar, prmUser.first_name.trim())
            .input(input_last_name, sql.NVarChar, prmUser.last_name.trim())
            .input(input_position, sql.NVarChar, prmUser.position.trim())
            .input(input_email, sql.NVarChar, (prmUser.email != undefined) ? prmUser.email.trim() : null)
            .input(input_mobile_no, sql.NVarChar, prmUser.mobile_no.trim())
            .input(input_record_status, sql.NVarChar, prmUser.record_status.trim())
            .input(input_create_date, sql.NVarChar, prmUser.create_date)
            .input(input_create_by, sql.NVarChar, prmUser.create_by.trim())
            .input(input_phc_user, sql.NVarChar, prmUser.phc_user.trim())
            .query(querysql)
        
        if (result.rowsAffected > 0) {

        }
    } catch (err) {
        //400 Bad Request
    } finally {
        await sql.close()
    }
}
async function GetUsersByUsername(username) {
    try {
        const querysql = 'SELECT * FROM USERS WHERE PHC_USER = @input_username'
                const input_username = 'input_username'
                let pool = await sql.connect(settings.dbConfig)
                let result = await pool.request()
                    .input(input_username, sql.NVarChar, username)
                    .query(querysql)
                
                return result
    } catch (err) {       
    } finally {
        await sql.close()
    }
}










