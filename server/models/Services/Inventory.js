const sql = require('mssql') // MS Sql Server client
const uuid = require('uuid/v1');

const settings = require('../../../settings')
const digit = require('../digit_number')
const utils = require('../../models/Services/utils')

module.exports.GetAccountCodeForInventory = GetAccountCodeForInventory
module.exports.GetDropDownGrpBy = GetDropDownGrpBy
module.exports.GetDropDownCatCode = GetDropDownCatCode
module.exports.GetDropDownAccType = GetDropDownAccType
module.exports.CheckDuplicateAccountCodeForInventory = CheckDuplicateAccountCodeForInventory
module.exports.InsertAccountCodeForInventory = InsertAccountCodeForInventory
module.exports.GetTempAccountCodeForInventory = GetTempAccountCodeForInventory
module.exports.EditAccountCodeForInventory = EditAccountCodeForInventory

async function GetAccountCodeForInventory() {
    let res = {}
    try {
        let querysql = `SELECT M.*, 
                A.LOV_DESC GRPBY_DESC, 
                B.LOV_DESC CATCODE_DESC 
        FROM   acc_m_account_inven M 
                LEFT JOIN (SELECT LOV1, 
                                LOV_DESC 
                        FROM   LOV_DATA 
                        WHERE  LOV_GROUP = 'SDC' 
                                AND LOV_TYPE = 'INVENTORY' 
                                AND LOV_CODE = 'GRPBY' 
                                AND ACTIVE_FLAG = 'A') A 
                    ON M.grpby = A.LOV1 
                LEFT JOIN (SELECT LOV1, 
                                LOV_DESC 
                        FROM   LOV_DATA 
                        WHERE  LOV_GROUP = 'SDC' 
                                AND LOV_TYPE = 'INVENTORY' 
                                AND LOV_CODE = 'CATCODE' 
                                AND ACTIVE_FLAG = 'A') B 
                    ON M.CATCODE = B.LOV1 
        ORDER  BY M.ACTIONCODE, 
                M.INV_CLASS ASC `

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetDropDownGrpBy() {
    let res = {}
    try {
        let querysql = `SELECT   LOV1, 
                LOV_DESC 
        FROM     LOV_DATA 
        WHERE    LOV_GROUP = 'SDC' 
        AND      LOV_TYPE = 'INVENTORY' 
        AND      LOV_CODE = 'GRPBY' 
        AND      ACTIVE_FLAG = 'A' 
        ORDER BY LOV1 ASC;`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetDropDownCatCode() {
    let res = {}
    try {
        let querysql = `SELECT   LOV1, 
                LOV_DESC 
        FROM     LOV_DATA 
        WHERE    LOV_GROUP = 'SDC' 
        AND      LOV_TYPE = 'INVENTORY' 
        AND      LOV_CODE = 'CATCODE' 
        AND      ACTIVE_FLAG = 'A' 
        ORDER BY LOV1 ASC;`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetDropDownAccType() {
    let res = {}
    try {
        let querysql = `SELECT   LOV1, 
                LOV_DESC 
        FROM     LOV_DATA 
        WHERE    LOV_GROUP = 'SDC' 
        AND      LOV_TYPE = 'SALES' 
        AND      LOV_CODE = 'ACC_TYPE' 
        AND      ACTIVE_FLAG = 'A' 
        ORDER BY LOV1 ASC;`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function CheckDuplicateAccountCodeForInventory(prm) {
    let res = true
    try {
        let querysql = `SELECT * FROM ACC_M_ACCOUNT_INVEN 
                    WHERE ACTIONCODE = @input_actioncode 
                    AND INV_CLASS = @input_inv_class 
                    AND ACCTYPE = @input_acctype`

        const input_actioncode = 'input_actioncode'
        const input_inv_class = 'input_inv_class'
        const input_acctype = 'input_acctype'

        let pool = await sql.connect(settings.dbConfig)

        let result = await pool.request()
            .input(input_actioncode, sql.NVarChar, prm.action_code.trim())
            .input(input_inv_class, sql.NVarChar, prm.inv_class.trim())
            .input(input_acctype, sql.NVarChar, prm.acc_type.trim())
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res

}

async function InsertAccountCodeForInventory(prm) {
    let res
    try {
        if (prm.action_code && prm.inv_class && prm.action && prm.obj_account && prm.subsidary && prm.grp_by && prm.cat_code && prm.acc_type && prm.doc_no && prm.remark) {
            const querysql = `INSERT INTO ACC_M_ACCOUNT_INVEN 
                        (ACTIONCODE, 
                        INV_CLASS, 
                        ACTION, 
                        OBJACCOUT, 
                        SUBSIDARY, 
                        GRPBY, 
                        CATCODE, 
                        ACCTYPE, 
                        DOCNO, 
                        REMARK, 
                        CREATE_DATE, 
                        CREATE_BY) 
            VALUES      (@input_action_code, 
                        @input_inv_class, 
                        @input_action, 
                        @input_obj_account, 
                        @input_subsidary, 
                        @input_grp_by, 
                        @input_cat_code, 
                        @input_acc_type, 
                        @input_doc_no, 
                        @input_remark, 
                        @input_create_date, 
                        @input_create_by);`

            const input_action_code = 'input_action_code'
            const input_inv_class = 'input_inv_class'
            const input_action = 'input_action'
            const input_obj_account = 'input_obj_account'
            const input_subsidary = 'input_subsidary'
            const input_grp_by = 'input_grp_by'
            const input_cat_code = 'input_cat_code'
            const input_acc_type = 'input_acc_type'
            const input_doc_no = 'input_doc_no'
            const input_remark = 'input_remark'
            const input_create_date = 'input_create_date'
            const input_create_by = 'input_create_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_action_code, sql.NVarChar, prm.action_code)
                .input(input_inv_class, sql.NVarChar, prm.inv_class)
                .input(input_action, sql.NVarChar, prm.action)
                .input(input_obj_account, sql.NVarChar, prm.obj_account)
                .input(input_subsidary, sql.NVarChar, prm.subsidary)
                .input(input_grp_by, sql.NVarChar, prm.grp_by)
                .input(input_cat_code, sql.NVarChar, prm.cat_code)
                .input(input_acc_type, sql.NVarChar, prm.acc_type)
                .input(input_doc_no, sql.NVarChar, prm.doc_no)
                .input(input_remark, sql.NVarChar, prm.remark)
                .input(input_create_date, sql.NVarChar, prm.create_date)
                .input(input_create_by, sql.NVarChar, prm.create_by)
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

async function GetTempAccountCodeForInventory(prm) {
    let res = {}
    try {
        if (prm.action_code && prm.inv_class && prm.acc_type) {
            let querysql = `SELECT * 
            FROM   acc_m_account_inven 
            WHERE  actioncode = @input_action_code 
                AND inv_class = @input_inv_class 
                AND acctype = @input_acc_type`

            const input_action_code = 'input_action_code'
            const input_inv_class = 'input_inv_class'
            const input_acc_type = 'input_acc_type'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_action_code, sql.NVarChar, prm.action_code)
                .input(input_inv_class, sql.NVarChar, prm.inv_class)
                .input(input_acc_type, sql.NVarChar, prm.acc_type)
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = result
            }
        }
    } catch (err) {
    } finally {
        await sql.close()
    }

    return await res
}

async function EditAccountCodeForInventory(prm) {
    let res
    try {
        if (prm.action_code && prm.inv_class && prm.acc_type) {
            let querysql = `UPDATE ACC_M_ACCOUNT_INVEN   SET `
            if (prm.action != undefined) querysql += `ACTION   = @input_action `
            if (prm.obj_account != undefined) querysql = [querysql, `OBJACCOUT  = @input_obj_account `].join(",")
            if (prm.subsidary != undefined) querysql = [querysql, `SUBSIDARY  = @input_subsidary `].join(",")
            if (prm.grp_by != undefined) querysql = [querysql, `GRPBY  = @input_grp_by `].join(",")
            if (prm.cat_code != undefined) querysql = [querysql, `CATCODE   = @input_cat_code `].join(",")
            if (prm.doc_no != undefined) querysql = [querysql, `DOCNO    = @input_doc_no `].join(",")
            if (prm.remark != undefined) querysql = [querysql, `REMARK     = @input_remark `].join(",")
            if (prm.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prm.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")

            querysql += ` WHERE ACTIONCODE   = @input_action_code `
            querysql += ` AND INV_CLASS    = @input_inv_class `
            querysql += ` AND ACCTYPE     = @input_acc_type `


            const input_action_code = 'input_action_code'
            const input_inv_class = 'input_inv_class'
            const input_action = 'input_action'
            const input_obj_account = 'input_obj_account'
            const input_subsidary = 'input_subsidary'
            const input_grp_by = 'input_grp_by'
            const input_cat_code = 'input_cat_code'
            const input_acc_type = 'input_acc_type'
            const input_doc_no = 'input_doc_no'
            const input_remark = 'input_remark'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()

            if (prm.action_code != undefined) await result.input(input_action_code, sql.NVarChar, prm.action_code)
            if (prm.inv_class != undefined) await result.input(input_inv_class, sql.NVarChar, prm.inv_class)
            if (prm.action != undefined) await result.input(input_action, sql.NVarChar, prm.action)
            if (prm.obj_account != undefined) await result.input(input_obj_account, sql.NVarChar, prm.obj_account)
            if (prm.subsidary != undefined) await result.input(input_subsidary, sql.NVarChar, prm.subsidary)
            if (prm.grp_by != undefined) await result.input(input_grp_by, sql.NVarChar, prm.grp_by)
            if (prm.cat_code != undefined) await result.input(input_cat_code, sql.NVarChar, prm.cat_code)
            if (prm.acc_type != undefined) await result.input(input_acc_type, sql.NVarChar, prm.acc_type)
            if (prm.doc_no != undefined) await result.input(input_doc_no, sql.NVarChar, prm.doc_no)
            if (prm.remark != undefined) await result.input(input_remark, sql.NVarChar, prm.remark)
            if (prm.update_date != undefined) await result.input(input_update_date, sql.NVarChar, prm.update_date)
            if (prm.update_by != undefined) await result.input(input_update_by, sql.NVarChar, prm.update_by)
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


