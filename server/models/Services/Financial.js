const sql = require('mssql') // MS Sql Server client
const uuid = require('uuid/v1');

const settings = require('../../../settings')
const digit = require('../digit_number')
const utils = require('../../models/Services/utils')

module.exports.GetFinancialCode = GetFinancialCode;
module.exports.GetFinancialCodeById = GetFinancialCodeById;
module.exports.FinancialCodeCheckDuplicate = FinancialCodeCheckDuplicate;
module.exports.EditFinancialCode = EditFinancialCode;

module.exports.GetBankAccount = GetBankAccount;
module.exports.GetBankAccountById = GetBankAccountById;
module.exports.InsertBankAccount = InsertBankAccount;
module.exports.EditBankAccount = EditBankAccount;
module.exports.DeleteBankAccountById = DeleteBankAccountById;
module.exports.CheckDuplicateBankAccount = CheckDuplicateBankAccount;

module.exports.GetAccountCodeForSale = GetAccountCodeForSale;
module.exports.GetAccountCodeForSaleById = GetAccountCodeForSaleById;
module.exports.InsertAccountCodeForSale = InsertAccountCodeForSale;
module.exports.EditAccountCodeForSale = EditAccountCodeForSale;
module.exports.GetDropDownBuType = GetDropDownBuType;
module.exports.GetDropDownType = GetDropDownType;
module.exports.CheckDuplicateAccountCodeForSale = CheckDuplicateAccountCodeForSale;
module.exports.CheckEditDuplicateAccountCodeForSale = CheckEditDuplicateAccountCodeForSale;

module.exports.GetBankInAdjustment = GetBankInAdjustment
module.exports.GetPopupStoreBankInAdjustment = GetPopupStoreBankInAdjustment
module.exports.GetValidationstoreBankInAdjustment = GetValidationstoreBankInAdjustment
module.exports.GetValidationfinancialcodeBankInAdjustment = GetValidationfinancialcodeBankInAdjustment
module.exports.GetDailyFinsByData = GetDailyFinsByData
module.exports.EditBankInAdjustment = EditBankInAdjustment
module.exports.GenGLBankInAdjustment = GenGLBankInAdjustment

module.exports.SearchTempStampCloseDaiyFins = SearchTempStampCloseDaiyFins
module.exports.SearchTempReCloseDaiyFins = SearchTempReCloseDaiyFins
module.exports.CountStampCloseDaiyFins = CountStampCloseDaiyFins
module.exports.AddStampCloseDaiyFins = AddStampCloseDaiyFins
module.exports.EditStampCloseDaiyFins = EditStampCloseDaiyFins


//Report
module.exports.ExportReportDailyFlashSales = ExportReportDailyFlashSales

async function GetFinancialCode() {
    let res = {}
    try {
        let querysql = ` SELECT * FROM ACC_M_FINANCIAL_CODES 
        WHERE FINANCIAL_CODE < 100 ORDER BY FINANCIAL_CODE ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res

}

async function GetFinancialCodeById(fin_code) {
    let res = {}
    try {
        let querysql = `SELECT * FROM ACC_M_FINANCIAL_CODES WHERE FINANCIAL_CODE = @input_fin_code `
        const input_fin_code = 'input_fin_code'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().input(input_fin_code, sql.NVarChar, fin_code).query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}

async function FinancialCodeCheckDuplicate(prmfin) {
    let res = true
    try {
        let querysql = `SELECT FINANCIAL_CODE FROM   ACC_M_FINANCIAL_CODES WHERE 1=1 `
        if (prmfin.fin_code != undefined) querysql += `AND FINANCIAL_CODE <> @input_fin_code `
        if (prmfin.fin_desc != undefined) querysql += `AND FINANCIAL_DESC = @input_fin_desc `
        if (prmfin.fin_gl_code != undefined) querysql += `AND FIN_GL_CODE = @input_fin_gl_code `
        if (prmfin.post_to_gl != undefined) querysql += `AND POST_TO_GL = @input_post_to_gl `
        if (prmfin.db_or_cr != undefined) querysql += `AND DB_OR_CR = @input_db_or_cr `
        if (prmfin.reconcile != undefined) querysql += `AND RECONCILE = @input_reconcile `
        if (prmfin.cost_center != undefined) querysql += `AND COST_CENTER = @input_cost_center `
        if (prmfin.fixflag != undefined) querysql += `AND FIXFLAG = @input_fixflag `
        if (prmfin.priority != undefined) querysql += `AND PRIORITY = @input_priority `
        if (prmfin.negative != undefined) querysql += `AND NEGATIVE_FLAG = @input_negative `
        if (prmfin.block_flag != undefined) querysql += `AND BLOCK_FLAG = @input_block_flag `
        if (prmfin.remart_flag != undefined) querysql += `AND REMARK_FLAG = @input_remart_flag `

        const input_fin_code = 'input_fin_code'
        const input_fin_desc = 'input_fin_desc'
        const input_fin_gl_code = 'input_fin_gl_code'
        const input_db_or_cr = 'input_db_or_cr'
        const input_reconcile = 'input_reconcile'
        const input_cost_center = 'input_cost_center'
        const input_fixflag = 'input_fixflag'
        const input_priority = 'input_priority'
        const input_negative = 'input_negative'
        const input_block_flag = 'input_block_flag'
        const input_remart_flag = 'input_remart_flag'


        let pool = await sql.connect(settings.dbConfig)

        let result = await pool.request()

        if (prmfin.fin_code != undefined) await result.input(input_fin_code, sql.NVarChar, prmfin.fin_code.trim())
        if (prmfin.fin_desc != undefined) await result.input(input_fin_desc, sql.NVarChar, prmfin.fin_desc.trim())
        if (prmfin.fin_gl_code != undefined) await result.input(input_fin_gl_code, sql.NVarChar, prmfin.fin_gl_code.trim())
        if (prmfin.post_to_gl != undefined) await result.input(input_db_or_cr, sql.NVarChar, prmfin.post_to_gl.trim())
        if (prmfin.db_or_cr != undefined) await result.input(input_db_or_cr, sql.NVarChar, prmfin.db_or_cr.trim())
        if (prmfin.reconcile != undefined) await result.input(input_reconcile, sql.NVarChar, prmfin.reconcile.trim())
        if (prmfin.cost_center != undefined) await result.input(input_cost_center, sql.NVarChar, prmfin.cost_center.trim())
        if (prmfin.fixflag != undefined) await result.input(input_fixflag, sql.NVarChar, prmfin.fixflag.trim())
        if (prmfin.priority != undefined) await result.input(input_priority, sql.NVarChar, prmfin.priority.trim())
        if (prmfin.negative != undefined) await result.input(input_negative, sql.NVarChar, prmfin.negative.trim())
        if (prmfin.block_flag != undefined) await result.input(input_block_flag, sql.NVarChar, prmfin.block_flag.trim())
        if (prmfin.remart_flag != undefined) await result.input(input_remart_flag, sql.NVarChar, prmfin.remart_flag.trim())

        result = await result.query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res

}

async function EditFinancialCode(prmfin) {
    let res
    try {
        if (prmfin.fin_code) {
            let querysql = `UPDATE ACC_M_FINANCIAL_CODES  SET FINANCIAL_CODE=FINANCIAL_CODE `

            if (prmfin.fin_desc != undefined) querysql = [querysql, `FINANCIAL_DESC = @input_fin_desc `].join(",")
            if (prmfin.fin_gl_code != undefined) querysql = [querysql, `FIN_GL_CODE = @input_fin_gl_code `].join(",")
            if (prmfin.post_to_gl != undefined) querysql = [querysql, `POST_TO_GL = @input_post_to_gl `].join(",")
            if (prmfin.db_or_cr != undefined) querysql = [querysql, `DB_OR_CR = @input_db_or_cr `].join(",")
            if (prmfin.reconcile != undefined) querysql = [querysql, `RECONCILE = @input_reconcile `].join(",")
            if (prmfin.cost_center != undefined) querysql = [querysql, `COST_CENTER = @input_cost_center `].join(",")
            if (prmfin.fin_flag != undefined) querysql = [querysql, `FIXFLAG = @input_fixflag `].join(",")
            if (prmfin.priority != undefined) querysql = [querysql, `PRIORITY = @input_priority `].join(",")
            if (prmfin.negative != undefined) querysql = [querysql, `NEGATIVE_FLAG = @input_negative `].join(",")
            if (prmfin.block_flag != undefined) querysql = [querysql, `BLOCK_FLAG = @input_block_flag `].join(",")
            if (prmfin.remart_flag != undefined) querysql = [querysql, `REMARK_FLAG = @input_remart_flag `].join(",")
            if (prmfin.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prmfin.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")

            querysql += ` WHERE FINANCIAL_CODE = @input_fin_code `

            const input_fin_code = 'input_fin_code'
            const input_fin_desc = 'input_fin_desc'
            const input_fin_gl_code = 'input_fin_gl_code'
            const input_db_or_cr = 'input_db_or_cr'
            const input_reconcile = 'input_reconcile'
            const input_cost_center = 'input_cost_center'
            const input_fixflag = 'input_fixflag'
            const input_priority = 'input_priority'
            const input_negative = 'input_negative'
            const input_block_flag = 'input_block_flag'
            const input_remart_flag = 'input_remart_flag'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()

            if (prmfin.fin_code != undefined) await result.input(input_fin_code, sql.NVarChar, prmfin.fin_code.trim())
            if (prmfin.fin_desc != undefined) await result.input(input_fin_desc, sql.NVarChar, prmfin.fin_desc.trim())
            if (prmfin.fin_gl_code != undefined) await result.input(input_fin_gl_code, sql.NVarChar, prmfin.fin_gl_code.trim())
            if (prmfin.post_to_gl != undefined) await result.input(input_db_or_cr, sql.NVarChar, prmfin.post_to_gl.trim())
            if (prmfin.db_or_cr != undefined) await result.input(input_db_or_cr, sql.NVarChar, prmfin.db_or_cr.trim())
            if (prmfin.reconcile != undefined) await result.input(input_reconcile, sql.NVarChar, prmfin.reconcile.trim())
            if (prmfin.cost_center != undefined) await result.input(input_cost_center, sql.NVarChar, prmfin.cost_center.trim())
            if (prmfin.fin_flag != undefined) await result.input(input_fixflag, sql.NVarChar, prmfin.fin_flag.trim())
            if (prmfin.priority != undefined) await result.input(input_priority, sql.NVarChar, prmfin.priority.trim())
            if (prmfin.negative != undefined) await result.input(input_negative, sql.NVarChar, prmfin.negative.trim())
            if (prmfin.block_flag != undefined) await result.input(input_block_flag, sql.NVarChar, prmfin.block_flag.trim())
            if (prmfin.remart_flag != undefined) await result.input(input_remart_flag, sql.NVarChar, prmfin.remart_flag.trim())

            if (prmfin.update_date != undefined) await result.input(input_update_date, sql.NVarChar, prmfin.update_date.trim())
            if (prmfin.update_by != undefined) await result.input(input_update_by, sql.NVarChar, prmfin.update_by.trim())
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

////////////////////////  Bank Account  //////////////////////// 
async function GetBankAccount() {
    let res = {}
    try {
        let querysql = ` SELECT A.BANK_CODE,A.BANK_NAME, A.BANK_BRANCH, A.ACCOUNT_CODE
        FROM ACC_M_BANK A ORDER BY BANK_CODE `

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res

}

async function GetBankAccountById(bank_code) {
    let res = {}
    try {
        let querysql = `SELECT * FROM ACC_M_BANK WHERE BANK_CODE = @input_bank_code `
        const input_bank_code = 'input_bank_code'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().input(input_bank_code, sql.NVarChar, bank_code.trim()).query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}

async function InsertBankAccount(prm) {
    let res
    try {
        if (prm.bank_code) {
            const querysql = `INSERT INTO ACC_M_BANK
                (BANK_CODE, 
                BANK_NAME, 
                BANK_BRANCH, 
                CREATE_DATE, 
                ACCOUNT_CODE, 
                CREATE_BY) 
    VALUES      (@input_bank_code, 
                @input_bank_name, 
                @input_bank_branch, 
                @input_create_date, 
                @input_account_code, 
                @input_create_by) `

            const input_bank_code = 'input_bank_code'
            const input_bank_name = 'input_bank_name'
            const input_bank_branch = 'input_bank_branch'
            const input_create_date = 'input_create_date'
            const input_account_code = 'input_account_code'
            const input_create_by = 'input_create_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_bank_code, sql.NVarChar, prm.bank_code.trim())
                .input(input_bank_name, sql.NVarChar, (prm.bank_name != undefined) ? prm.bank_name.trim() : '')
                .input(input_bank_branch, sql.NVarChar, (prm.bank_branch != undefined) ? prm.bank_branch.trim() : '')
                .input(input_create_date, sql.NVarChar, (prm.create_date != undefined) ? prm.create_date : '')
                .input(input_account_code, sql.NVarChar, (prm.account_code != undefined) ? prm.account_code.trim() : '')
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

async function EditBankAccount(prm) {
    let res
    try {
        if (prm.bank_code) {
            let querysql = `UPDATE ACC_M_BANK  SET BANK_CODE=BANK_CODE `

            if (prm.bank_name != undefined) querysql = [querysql, `BANK_NAME = @input_bank_name `].join(",")
            if (prm.bank_branch != undefined) querysql = [querysql, `BANK_BRANCH = @input_bank_branch `].join(",")
            if (prm.account_code != undefined) querysql = [querysql, `ACCOUNT_CODE = @input_account_code `].join(",")
            if (prm.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prm.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")

            querysql += ` WHERE BANK_CODE = @input_bank_code `

            const input_bank_code = 'input_bank_code'
            const input_bank_name = 'input_bank_name'
            const input_bank_branch = 'input_bank_branch'
            const input_account_code = 'input_account_code'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()

            if (prm.bank_code != undefined) await result.input(input_bank_code, sql.NVarChar, prm.bank_code.trim())
            if (prm.bank_name != undefined) await result.input(input_bank_name, sql.NVarChar, prm.bank_name.trim())
            if (prm.bank_branch != undefined) await result.input(input_bank_branch, sql.NVarChar, prm.bank_branch.trim())
            if (prm.account_code != undefined) await result.input(input_account_code, sql.NVarChar, prm.account_code.trim())
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

async function DeleteBankAccountById(bank_code) {
    let res
    try {
        if (bank_code) {
            let querysql = `DELETE ACC_M_BANK
            WHERE  BANK_CODE = @input_bank_code `

            const input_bank_code = 'input_bank_code'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_bank_code, sql.NVarChar, bank_code.trim())
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

async function CheckDuplicateBankAccount(bank_code) {
    let res = true
    try {
        let querysql = `SELECT * FROM  ACC_M_BANK A WHERE  A.BANK_CODE = @input_bank_code`

        const input_bank_code = 'input_bank_code'

        let pool = await sql.connect(settings.dbConfig)

        let result = await pool.request()
            .input(input_bank_code, sql.NVarChar, bank_code.trim())
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


////////////////////////  Account Code For Sale  //////////////////////// 
async function GetAccountCodeForSale() {
    let res = {}
    try {
        let querysql = `SELECT * FROM ACC_M_ACCOUNT_SALE ORDER BY FORMULARID ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res

}

async function GetAccountCodeForSaleById(formular_id) {
    let res = {}
    try {
        let querysql = `SELECT * FROM ACC_M_ACCOUNT_SALE WHERE FORMULARID = @input_formular_id `
        const input_formular_id = 'input_formular_id'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().input(input_formular_id, sql.NVarChar, formular_id.trim()).query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}

async function InsertAccountCodeForSale(prm) {
    let res
    try {
        let id = await utils.GetCountACC_M_ACCOUNT_SALE()

        if (prm.formular_name && prm.account_code) {
            const querysql = `INSERT INTO ACC_M_ACCOUNT_SALE
                    (FORMULARID, 
                    FORMULARNAME, 
                    ACCOUNTCODE, 
                    BU_TYPE, 
                    TYPE, 
                    SUBLEDGERTYPE, 
                    SUBLEDGER, 
                    CREATE_DATE, 
                    CREATE_BY) 
            VALUES  (@input_formular_id, 
                    @input_formular_name, 
                    @input_account_code, 
                    @input_bu_type, 
                    @input_type, 
                    @input_subledger_type,
                    @input_subledger,
                    @input_create_date,
                    @input_create_by) `

            const input_formular_id = 'input_formular_id'
            const input_formular_name = 'input_formular_name'
            const input_account_code = 'input_account_code'
            const input_bu_type = 'input_bu_type'
            const input_type = 'input_type'
            const input_subledger_type = 'input_subledger_type'
            const input_subledger = 'input_subledger'
            const input_create_date = 'input_create_date'
            const input_create_by = 'input_create_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_formular_id, sql.Int, id)
                .input(input_formular_name, sql.NVarChar, (prm.formular_name != undefined) ? prm.formular_name : '')
                .input(input_account_code, sql.NVarChar, (prm.account_code != undefined) ? prm.account_code : '')
                .input(input_bu_type, sql.NVarChar, (prm.bu_type != undefined) ? prm.bu_type : '')
                .input(input_type, sql.NVarChar, (prm.type != undefined) ? prm.type : '')
                .input(input_subledger_type, sql.NVarChar, (prm.subledger_type != undefined) ? prm.subledger_type : '')
                .input(input_subledger, sql.NVarChar, (prm.subledger != undefined) ? prm.subledger : '')
                .input(input_create_date, sql.NVarChar, (prm.create_date != undefined) ? prm.create_date : '')
                .input(input_create_by, sql.NVarChar, (prm.create_by != undefined) ? prm.create_by : '')
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

async function EditAccountCodeForSale(prm) {
    let res
    try {
        if (prm.formular_id) {
            let querysql = `UPDATE ACC_M_ACCOUNT_SALE  SET FORMULARID=FORMULARID `

            if (prm.formular_name != undefined) querysql = [querysql, `FORMULARNAME  = @input_formular_name `].join(",")
            if (prm.account_code != undefined) querysql = [querysql, `ACCOUNTCODE  = @input_account_code `].join(",")
            if (prm.bu_type != undefined) querysql = [querysql, `BU_TYPE  = @input_bu_type `].join(",")
            if (prm.type != undefined) querysql = [querysql, `TYPE  = @input_type `].join(",")
            if (prm.subledger_type != undefined) querysql = [querysql, `SUBLEDGERTYPE   = @input_subledger_type `].join(",")
            if (prm.subledger != undefined) querysql = [querysql, `SUBLEDGER    = @input_subledger `].join(",")
            if (prm.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prm.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")

            querysql += ` WHERE FORMULARID  = @input_formular_id `

            const input_formular_id = 'input_formular_id'
            const input_formular_name = 'input_formular_name'
            const input_account_code = 'input_account_code'
            const input_bu_type = 'input_bu_type'
            const input_type = 'input_type'
            const input_subledger_type = 'input_subledger_type'
            const input_subledger = 'input_subledger'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()

            if (prm.formular_id != undefined) await result.input(input_formular_id, sql.NVarChar, prm.formular_id)
            if (prm.formular_name != undefined) await result.input(input_formular_name, sql.NVarChar, prm.formular_name)
            if (prm.account_code != undefined) await result.input(input_account_code, sql.NVarChar, prm.account_code)
            if (prm.bu_type != undefined) await result.input(input_bu_type, sql.NVarChar, prm.bu_type)
            if (prm.type != undefined) await result.input(input_type, sql.NVarChar, prm.type)
            if (prm.subledger_type != undefined) await result.input(input_subledger_type, sql.NVarChar, prm.subledger_type)
            if (prm.subledger != undefined) await result.input(input_subledger, sql.NVarChar, prm.subledger)
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

async function GetDropDownBuType() {
    let res = {}
    try {
        let querysql = `SELECT LOV1 FROM LOV_DATA 
        WHERE LOV_GROUP = 'SDC' 
        AND LOV_TYPE = 'SALES' 
        AND LOV_CODE = 'BU_TYPE' 
        ORDER BY LOV1 ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetDropDownType() {
    let res = {}
    try {
        let querysql = `SELECT LOV1 FROM LOV_DATA 
        WHERE LOV_GROUP = 'SDC' 
        AND LOV_TYPE = 'SALES' 
        AND LOV_CODE = 'ACC_TYPE' 
        ORDER BY LOV1 ASC`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function CheckDuplicateAccountCodeForSale(formular_name) {
    let res = true
    try {
        let querysql = `SELECT * FROM  ACC_M_ACCOUNT_SALE WHERE  FORMULARNAME = @input_formular_name`

        const input_formular_name = 'input_formular_name'

        let pool = await sql.connect(settings.dbConfig)

        let result = await pool.request()
            .input(input_formular_name, sql.NVarChar, formular_name.trim())
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

async function CheckEditDuplicateAccountCodeForSale(prm) {
    let res = true
    try {
        let querysql = `SELECT * FROM   ACC_M_ACCOUNT_SALE WHERE 1=1 `
        if (prm.formular_id != undefined) querysql += `AND FORMULARID <> @input_formular_id `
        if (prm.formular_name != undefined) querysql += `AND FORMULARNAME = @input_formular_name `

        const input_formular_id = 'input_formular_id'
        const input_formular_name = 'input_formular_name'

        let pool = await sql.connect(settings.dbConfig)

        let result = await pool.request()
        if (prm.formular_id != undefined) await result.input(input_formular_id, sql.NVarChar, prm.formular_id.trim())
        if (prm.formular_name != undefined) await result.input(input_formular_name, sql.NVarChar, prm.formular_name.trim())
        result = await result.query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res

}


////////////////////////  BankInAdjustment  //////////////////////// 
async function GetPopupStoreBankInAdjustment() {
    let res = {}
    try {
        let querysql = ` SELECT STORE_ID,STORE_NAME 
                        FROM PH_STORES 
                        WHERE COMPANY = 'Y' 
                        ORDER BY STORE_ID ASC;`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetValidationstoreBankInAdjustment() {
    let res = {}
    try {
        let querysql = `SELECT STORE_ID,
                            STORE_NAME 
                        FROM   PH_STORES  
                        WHERE  COMPANY = 'Y' `

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetValidationfinancialcodeBankInAdjustment() {
    let res = {}
    try {
        let querysql = `SELECT F.FINANCIAL_CODE 
                        FROM   ACC_M_FINANCIAL_CODES F
                            JOIN (SELECT DISTINCT LOV1  
                                    FROM   LOV_DATA  
                                    WHERE  LOV_GROUP = 'SDC'  
                                            AND LOV_TYPE = 'SALES'  
                                            AND LOV_CODE = 'EDIT_DAILY_FINS') L  
                                ON F.FINANCIAL_CODE = L.LOV1  
                        WHERE  F.FIXFLAG = 1`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}
async function GetBankInAdjustment(store, dateofstore) {
    let result
    try {
        const querysql = `SELECT D.STORE, 
                                D.FINANCIAL_DATE, 
                                D.FINANCIAL_CODE, 
                                FINANCIAL_DESC, 
                                D.DAILY_FIN, 
                                D.S_DAILY_FIN, 
                                CASE 
                                WHEN L.LOV1 IS NULL THEN 'N' 
                                ELSE 'Y' 
                                END CAN_EDIT 
                        FROM   ACC_DAILY_FINS D 
                                INNER JOIN ACC_M_FINANCIAL_CODES F 
                                        ON D.FINANCIAL_CODE = F.FINANCIAL_CODE 
                                LEFT JOIN (SELECT DISTINCT LOV1 
                                        FROM   LOV_DATA 
                                        WHERE  LOV_GROUP = 'SDC' 
                                                AND LOV_TYPE = 'SALES' 
                                                AND LOV_CODE = 'EDIT_DAILY_FINS') L 
                                    ON D.FINANCIAL_CODE = L.LOV1 
                        WHERE  F.FIXFLAG = 1 
                                AND D.FINANCIAL_DATE = @input_dateofstore
                                AND D.STORE = @input_store
                        ORDER  BY D.STORE, 
                                D.FINANCIAL_DATE, 
                                D.FINANCIAL_CODE ASC `
        // input parameter       
        const input_store = 'input_store'
        const input_dateofstore = 'input_dateofstore'

        let pool = await sql.connect(settings.dbConfig)

        result = await pool.request()
            // set parameter
            .input(input_store, sql.NVarChar, store.trim())
            .input(input_dateofstore, sql.NVarChar, dateofstore.trim())
            .query(querysql)
        await sql.close()

    } catch (err) {
    }
    return await result
}

async function GetDailyFinsByData(obj) {
    let res
    try {
        let querysql = `SELECT * FROM ACC_DAILY_FINS  WHERE STORE = @input_store_id AND FINANCIAL_CODE = @input_fin_code AND FINANCIAL_DATE = @input_fin_date `
        const input_store_id = 'input_store_id'
        const input_fin_code = 'input_fin_code'
        const input_fin_date = 'input_fin_date'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_store_id, sql.NVarChar, obj.store_id)
            .input(input_fin_code, sql.NVarChar, obj.fin_code)
            .input(input_fin_date, sql.NVarChar, obj.fin_date)
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }
    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}

async function EditBankInAdjustment(prm) {
    let res

    try {
        if (prm) {
            let querysql = `UPDATE ACC_DAILY_FINS SET STORE=STORE `
            if (prm.daily_fin != undefined) querysql = [querysql, `DAILY_FIN = @input_daily_fin `].join(",")
            if (prm.store_daily_fin != undefined) querysql = [querysql, `S_DAILY_FIN = @input_store_daily_fin `].join(",")
            if (prm.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prm.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")
            querysql = [querysql, `LASTUPDATEBY = 'A' `].join(",")
            querysql += `WHERE  STORE = @input_store_id 
                   AND FINANCIAL_DATE = @input_fin_date 
                   AND FINANCIAL_CODE = @input_fin_code `

            const input_store_id = 'input_store_id'
            const input_fin_code = 'input_fin_code'
            const input_fin_date = 'input_fin_date'
            const input_daily_fin = 'input_daily_fin'
            const input_store_daily_fin = 'input_store_daily_fin'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
            if (prm.store_id != undefined) await result.input(input_store_id, sql.NVarChar, prm.store_id.trim())
            if (prm.fin_code != undefined) await result.input(input_fin_code, sql.NVarChar, prm.fin_code.trim())
            if (prm.fin_date != undefined) await result.input(input_fin_date, sql.NVarChar, prm.fin_date.trim())
            if (prm.daily_fin != undefined) await result.input(input_daily_fin, sql.NVarChar, prm.daily_fin.trim())
            if (prm.store_daily_fin != undefined) await result.input(input_store_daily_fin, sql.NVarChar, prm.store_daily_fin.trim())
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

//GenGLBankInAdjustment
async function GenGLBankInAdjustment(prm) {
    let res

    try {
        if (prm) {
            const p_doc_type = 'p_doc_type'
            const p_ledger_type = 'p_ledger_type'
            const p_from_date = 'p_from_date'
            const p_to_date = 'p_to_date'
            const p_from_store = 'p_from_store'
            const p_to_store = 'p_to_store'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(p_doc_type, sql.NVarChar, prm.gldoc_type)
                .input(p_ledger_type, sql.NVarChar, prm.glledger_type)
                .input(p_from_date, sql.NVarChar, prm.glfrom_date)
                .input(p_to_date, sql.NVarChar, prm.glto_date)
                .input(p_from_store, sql.NVarChar, prm.glfrom_store)
                .input(p_to_store, sql.NVarChar, prm.glto_store)
                .execute('GEN_GL_TO_E1')
            if (result !== undefined) {
                res = result.recordset
            }
        }
    } catch (err) {

    } finally {
        await sql.close()
    }
    return await res
}

////////////////////////  StampCloseDaiyFins  //////////////////////// 
async function SearchTempStampCloseDaiyFins(prm) {
    let res = {}
    try {
        let querysql = ` SELECT * FROM ACC_STAMPCLOSEDATA 
            WHERE TABLE_NAME = 'DAILY_FINS'
                AND START_DATE = @input_datefrom
                AND END_DATE = @input_dateto
                AND STATUS = 'A' `

        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_datefrom, sql.NVarChar, prm.datefrom)
            .input(input_dateto, sql.NVarChar, prm.dateto)
            .query(querysql)
        res = result
    } catch (err) {

    } finally {
        await sql.close()
    }
    return await res
}

async function SearchTempReCloseDaiyFins(prm) {
    let res = {}
    try {
        let querysql = ` SELECT * FROM ACC_STAMPCLOSEDATA 
            WHERE TABLE_NAME = 'DAILY_FINS'
                AND START_DATE = @input_datefrom
                AND END_DATE = @input_dateto
                AND STATUS = 'T' `

        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_datefrom, sql.NVarChar, prm.datefrom.trim())
            .input(input_dateto, sql.NVarChar, prm.dateto.trim())
            .query(querysql)
        res = result
    } catch (err) {

    } finally {
        await sql.close()
    }
    return await res
}

async function CountStampCloseDaiyFins(prm) {
    let res = {}
    try {
        let querysql = `SELECT * 
                FROM   ACC_STAMPCLOSEDATA 
                WHERE  START_DATE >= @input_datefrom
                    AND END_DATE <= @input_dateto
                    AND STATUS = 'A' 
                    AND TABLE_NAME = 'DAILY_FINS'`

        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_datefrom, sql.NVarChar, prm.datefrom.trim())
            .input(input_dateto, sql.NVarChar, prm.dateto.trim())
            .query(querysql)
        res = result

    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function AddStampCloseDaiyFins(prm) {
    let res
    try {
        if (prm.owner && prm.datefrom && prm.dateto && prm.create_date && prm.create_by) {
            const querysql = `INSERT INTO ACC_STAMPCLOSEDATA
                    (TABLE_NAME, 
                        OWNER, 
                        START_DATE, 
                        END_DATE,
                        CREATE_DATE, 
                        CREATE_BY,
                        STATUS) 
            VALUES  ('DAILY_FINS', 
                    @input_user_id, 
                    @input_datefrom, 
                    @input_dateto, 
                    @input_create_date, 
                    @input_create_by,
                    'A') `

            const input_user_id = 'input_user_id'
            const input_datefrom = 'input_datefrom'
            const input_dateto = 'input_dateto'
            const input_create_date = 'input_create_date'
            const input_create_by = 'input_create_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_user_id, sql.NVarChar, prm.owner)
                .input(input_datefrom, sql.NVarChar, prm.datefrom)
                .input(input_dateto, sql.NVarChar, prm.dateto)
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

async function EditStampCloseDaiyFins(prm) {
    let res
    try {
        if (prm.datefrom && prm.dateto && prm.update_date && prm.update_by) {

            const querysql = `UPDATE ACC_STAMPCLOSEDATA 
            SET    STATUS = 'I', 
                   UPDATE_DATE = @input_update_date, 
                   UPDATE_BY = @input_update_by                  
            WHERE  START_DATE >= @input_datefrom 
                   AND END_DATE <= @input_dateto 
                   AND STATUS = 'A' 
                   AND TABLE_NAME = 'DAILY_FINS' `

            const input_datefrom = 'input_datefrom'
            const input_dateto = 'input_dateto'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_datefrom, sql.NVarChar, prm.datefrom)
                .input(input_dateto, sql.NVarChar, prm.dateto)
                .input(input_update_date, sql.NVarChar, prm.update_date)
                .input(input_update_by, sql.NVarChar, prm.update_by)
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

async function ExportReportDailyFlashSales(prm) {
    let res

    try {
        if (prm) {
            const p_from_date = 'p_from_date'
            const p_to_date = 'p_to_date'
            const p_from_store = 'p_from_store'
            const p_to_store = 'p_to_store'

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
            result.multiple = true
            await result.input(p_from_date, sql.NVarChar, prm.datefrom)
            await result.input(p_to_date, sql.NVarChar, prm.dateto)
            await result.input(p_from_store, sql.NVarChar, prm.from_store)
            await result.input(p_to_store, sql.NVarChar, prm.to_store)
            const results = await result.execute('REPORT_DAILY_FLASH_SALE')           
            if (results !== undefined) {              
                if (results.recordsets.length > 0) {
                    if (results.recordsets[0].length > 0 || results.recordsets[1].length > 0 || results.recordsets[2].length > 0) {
                        res = results.recordsets
                    }
                }
            }
        }
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}