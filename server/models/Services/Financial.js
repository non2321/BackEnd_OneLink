import { connect, close, NVarChar, Int } from 'mssql'; // MS Sql Server client
import db from '../db'

import { dbConfig } from '../../../settings';
import { GetCountACC_M_ACCOUNT_SALE } from '../../models/Services/utils';

export {
    ServiceGetFinancialCode,
    ServiceGetFinancialCodeById,
    ServiceInsertFinancialCode,
    ServiceFinancialCodeCheckDuplicate,
    ServiceEditFinancialCode,

    ServiceGetBankAccount,
    ServiceGetBankAccountById,
    ServiceInsertBankAccount,
    ServiceEditBankAccount,
    ServiceDeleteBankAccountById,
    ServiceCheckDuplicateBankAccount,

    ServiceGetAccountCodeForSale,
    ServiceGetAccountCodeForSaleById,
    ServiceInsertAccountCodeForSale,
    ServiceEditAccountCodeForSale,
    ServiceGetDropDownBuType,
    ServiceGetDropDownType,
    ServiceCheckDuplicateAccountCodeForSale,
    ServiceCheckEditDuplicateAccountCodeForSale,

    ServiceGetBankInAdjustment,
    ServiceGetPopupStoreBankInAdjustment,
    ServiceGetValidationstoreBankInAdjustment,
    ServiceGetValidationfinancialcodeBankInAdjustment,
    ServiceGetDailyFinsByData,
    ServiceEditBankInAdjustment,
    ServiceGenGLBankInAdjustment,

    ServiceSearchTempStampCloseDaiyFins,
    ServiceSearchTempReCloseDaiyFins,
    ServiceCountStampCloseDaiyFins,
    ServiceAddStampCloseDaiyFins,
    ServiceEditStampCloseDaiyFins,

    ServiceExportReportDailyFlashSales,

    ServiceInsertPLBalE1,
    ServiceDeletePLBalE1,
    ServicePLBalE1_BALFile,
    ServicePLBalE1_BAL_ADJFile,
    ServicePLBalE1_ACTUALFile,
    ServicePLBalE1_ACTUAL_ADJFile,
    ServicePLBalE1_NetSalesFile,
    ServicePLBalE1_ACTUAL_SPA_AND__ACTUAL_ADJ_SPAFile
}

async function ServiceGetFinancialCode() {
    let res = {}
    try {
        let querysql = ` SELECT * FROM ACC_M_FINANCIAL_CODES 
        ORDER BY FINANCIAL_CODE ASC`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceGetFinancialCodeById(fin_code) {
    let res = {}
    try {
        let querysql = `SELECT financial_code, 
                            financial_desc, 
                            fin_gl_code, 
                            post_to_gl, 
                            db_or_cr, 
                            reconcile, 
                            cost_center, 
                            Format(create_date, 'MM/dd/yyyy hh:mm:ss tt') AS CREATE_DATE, 
                            create_by, 
                            Format(update_date, 'MM/dd/yyyy hh:mm:ss tt') AS UPDATE_DATE, 
                            update_by, 
                            fixflag, 
                            priority, 
                            negative_flag, 
                            block_flag,
                            remark_flag,
                            s_daily_fins_flag 
                    FROM   acc_m_financial_codes 
                    WHERE FINANCIAL_CODE = @input_fin_code `
        const input_fin_code = 'input_fin_code'
        const pool = await db.poolPromise
        let result = await pool.request().input(input_fin_code, NVarChar, fin_code).query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServiceInsertFinancialCode(prm) {
    let res
    try {
        if (prm.fin_code) {
            const querysql = `INSERT INTO ACC_M_FINANCIAL_CODES
                            (FINANCIAL_CODE, 
                            FINANCIAL_DESC, 
                            POST_TO_GL,
                            DB_OR_CR,
                            RECONCILE,
                            CREATE_DATE,
                            CREATE_BY,
                            FIXFLAG,
                            S_DAILY_FINS_FLAG,
                            BLOCK_FLAG) 
                VALUES      (@input_fin_code, 
                            @input_fin_name, 
                            'N', 
                            'N', 
                            'N', 
                            @input_create_date, 
                            @input_create_by, 
                            @input_active,
                            @input_show,
                            'N') `

            const input_fin_code = 'input_fin_code'
            const input_fin_name = 'input_fin_name'
            const input_active = 'input_active'
            const input_show = 'input_show'
            const input_create_date = 'input_create_date'
            const input_create_by = 'input_create_by'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_fin_code, NVarChar, (prm.fin_code != undefined) ? prm.fin_code : '')
                .input(input_fin_name, NVarChar, (prm.fin_name != undefined) ? prm.fin_name : '')
                .input(input_active, NVarChar, (prm.active != undefined) ? prm.active : '')
                .input(input_show, NVarChar, (prm.show != undefined) ? prm.show : '')
                .input(input_create_date, NVarChar, (prm.create_date != undefined) ? prm.create_date : '')
                .input(input_create_by, NVarChar, (prm.create_by != undefined) ? prm.create_by.trim() : '')
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

async function ServiceFinancialCodeCheckDuplicate(prmfin) {
    let res = true
    try {
        let querysql = `SELECT FINANCIAL_CODE FROM   ACC_M_FINANCIAL_CODES WHERE 1=1 `
        if (prmfin.fin_code != undefined) querysql += `AND FINANCIAL_CODE = @input_fin_code `
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


        const pool = await db.poolPromise
        let result = await pool.request()

        if (prmfin.fin_code != undefined) await result.input(input_fin_code, NVarChar, prmfin.fin_code.trim())
        if (prmfin.fin_desc != undefined) await result.input(input_fin_desc, NVarChar, prmfin.fin_desc.trim())
        if (prmfin.fin_gl_code != undefined) await result.input(input_fin_gl_code, NVarChar, prmfin.fin_gl_code.trim())
        if (prmfin.post_to_gl != undefined) await result.input(input_db_or_cr, NVarChar, prmfin.post_to_gl.trim())
        if (prmfin.db_or_cr != undefined) await result.input(input_db_or_cr, NVarChar, prmfin.db_or_cr.trim())
        if (prmfin.reconcile != undefined) await result.input(input_reconcile, NVarChar, prmfin.reconcile.trim())
        if (prmfin.cost_center != undefined) await result.input(input_cost_center, NVarChar, prmfin.cost_center.trim())
        if (prmfin.fixflag != undefined) await result.input(input_fixflag, NVarChar, prmfin.fixflag.trim())
        if (prmfin.priority != undefined) await result.input(input_priority, NVarChar, prmfin.priority.trim())
        if (prmfin.negative != undefined) await result.input(input_negative, NVarChar, prmfin.negative.trim())
        if (prmfin.block_flag != undefined) await result.input(input_block_flag, NVarChar, prmfin.block_flag.trim())
        if (prmfin.remart_flag != undefined) await result.input(input_remart_flag, NVarChar, prmfin.remart_flag.trim())

        result = await result.query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceEditFinancialCode(prmfin) {
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
            if (prmfin.fin_show != undefined) querysql = [querysql, `S_DAILY_FINS_FLAG = @input_s_daily_fins_flag `].join(",")

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
            const input_s_daily_fins_flag = 'input_s_daily_fins_flag'
            const input_priority = 'input_priority'
            const input_negative = 'input_negative'
            const input_block_flag = 'input_block_flag'
            const input_remart_flag = 'input_remart_flag'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            const pool = await db.poolPromise
            let result = await pool.request()

            if (prmfin.fin_code != undefined) await result.input(input_fin_code, NVarChar, prmfin.fin_code.trim())
            if (prmfin.fin_desc != undefined) await result.input(input_fin_desc, NVarChar, prmfin.fin_desc.trim())
            if (prmfin.fin_gl_code != undefined) await result.input(input_fin_gl_code, NVarChar, prmfin.fin_gl_code.trim())
            if (prmfin.post_to_gl != undefined) await result.input(input_db_or_cr, NVarChar, prmfin.post_to_gl.trim())
            if (prmfin.db_or_cr != undefined) await result.input(input_db_or_cr, NVarChar, prmfin.db_or_cr.trim())
            if (prmfin.reconcile != undefined) await result.input(input_reconcile, NVarChar, prmfin.reconcile.trim())
            if (prmfin.cost_center != undefined) await result.input(input_cost_center, NVarChar, prmfin.cost_center.trim())
            if (prmfin.fin_flag != undefined) await result.input(input_fixflag, NVarChar, prmfin.fin_flag.trim())
            if (prmfin.fin_show != undefined) await result.input(input_s_daily_fins_flag, NVarChar, prmfin.fin_show.trim())
            if (prmfin.priority != undefined) await result.input(input_priority, NVarChar, prmfin.priority.trim())
            if (prmfin.negative != undefined) await result.input(input_negative, NVarChar, prmfin.negative.trim())
            if (prmfin.block_flag != undefined) await result.input(input_block_flag, NVarChar, prmfin.block_flag.trim())
            if (prmfin.remart_flag != undefined) await result.input(input_remart_flag, NVarChar, prmfin.remart_flag.trim())

            if (prmfin.update_date != undefined) await result.input(input_update_date, NVarChar, prmfin.update_date.trim())
            if (prmfin.update_by != undefined) await result.input(input_update_by, NVarChar, prmfin.update_by.trim())
            result = await result.query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

////////////////////////  Bank Account  //////////////////////// 
async function ServiceGetBankAccount() {
    let res = {}
    try {
        let querysql = ` SELECT A.BANK_CODE,A.BANK_NAME, A.BANK_BRANCH, A.ACCOUNT_CODE
        FROM ACC_M_BANK A ORDER BY BANK_CODE `

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceGetBankAccountById(bank_code) {
    let res = {}
    try {
        let querysql = `SELECT BANK_CODE, 
                            BANK_NAME, 
                            BANK_BRANCH,
                            ACCOUNT_CODE, 
                            FORMAT(CREATE_DATE,'MM/dd/yyyy hh:mm:ss tt') AS CREATE_DATE,
                            CREATE_BY, 
                            FORMAT(UPDATE_DATE,'MM/dd/yyyy hh:mm:ss tt') AS UPDATE_DATE, 
                            UPDATE_BY  
                    FROM ACC_M_BANK 
                    WHERE BANK_CODE = @input_bank_code`
        const input_bank_code = 'input_bank_code'
        const pool = await db.poolPromise
        let result = await pool.request().input(input_bank_code, NVarChar, bank_code.trim()).query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServiceInsertBankAccount(prm) {
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

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_bank_code, NVarChar, prm.bank_code.trim())
                .input(input_bank_name, NVarChar, (prm.bank_name != undefined) ? prm.bank_name.trim() : '')
                .input(input_bank_branch, NVarChar, (prm.bank_branch != undefined) ? prm.bank_branch.trim() : '')
                .input(input_create_date, NVarChar, (prm.create_date != undefined) ? prm.create_date : '')
                .input(input_account_code, NVarChar, (prm.account_code != undefined) ? prm.account_code.trim() : '')
                .input(input_create_by, NVarChar, (prm.create_by != undefined) ? prm.create_by.trim() : '')
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceEditBankAccount(prm) {
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

            const pool = await db.poolPromise
            let result = await pool.request()

            if (prm.bank_code != undefined) await result.input(input_bank_code, NVarChar, prm.bank_code.trim())
            if (prm.bank_name != undefined) await result.input(input_bank_name, NVarChar, prm.bank_name.trim())
            if (prm.bank_branch != undefined) await result.input(input_bank_branch, NVarChar, prm.bank_branch.trim())
            if (prm.account_code != undefined) await result.input(input_account_code, NVarChar, prm.account_code.trim())
            if (prm.update_date != undefined) await result.input(input_update_date, NVarChar, prm.update_date.trim())
            if (prm.update_by != undefined) await result.input(input_update_by, NVarChar, prm.update_by.trim())
            result = await result.query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

async function ServiceDeleteBankAccountById(bank_code) {
    let res
    try {
        if (bank_code) {
            let querysql = `DELETE ACC_M_BANK
            WHERE  BANK_CODE = @input_bank_code `

            const input_bank_code = 'input_bank_code'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_bank_code, NVarChar, bank_code.trim())
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceCheckDuplicateBankAccount(bank_code) {
    let res = true
    try {
        let querysql = `SELECT * FROM  ACC_M_BANK A WHERE  A.BANK_CODE = @input_bank_code`

        const input_bank_code = 'input_bank_code'

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_bank_code, NVarChar, bank_code.trim())
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}


////////////////////////  Account Code For Sale  //////////////////////// 
async function ServiceGetAccountCodeForSale() {
    let res = {}
    try {
        let querysql = `SELECT * FROM ACC_M_ACCOUNT_SALE ORDER BY FORMULARID ASC`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceGetAccountCodeForSaleById(formular_id) {
    let res = {}
    try {
        let querysql = `SELECT formularid, 
                                formularname, 
                                accountcode, 
                                bu_type, 
                                type, 
                                subledgertype, 
                                subledger, 
                                Format(create_date, 'MM/dd/yyyy hh:mm:ss tt') AS CREATE_DATE, 
                                create_by, 
                                Format(update_date, 'MM/dd/yyyy hh:mm:ss tt') AS UPDATE_DATE, 
                                update_by, 
                                fin_code 
                        FROM   acc_m_account_sale 
                        WHERE FORMULARID = @input_formular_id `
        const input_formular_id = 'input_formular_id'
        const pool = await db.poolPromise
        let result = await pool.request().input(input_formular_id, NVarChar, formular_id.trim()).query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServiceInsertAccountCodeForSale(prm) {
    let res
    try {
        let id = await GetCountACC_M_ACCOUNT_SALE()

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
                    CREATE_BY,
                    FIN_CODE) 
            VALUES  (@input_formular_id, 
                    @input_formular_name, 
                    @input_account_code, 
                    @input_bu_type, 
                    @input_type, 
                    @input_subledger_type,
                    @input_subledger,
                    @input_create_date,
                    @input_create_by,
                    @input_fincode) `

            const input_formular_id = 'input_formular_id'
            const input_formular_name = 'input_formular_name'
            const input_account_code = 'input_account_code'
            const input_bu_type = 'input_bu_type'
            const input_type = 'input_type'
            const input_subledger_type = 'input_subledger_type'
            const input_subledger = 'input_subledger'
            const input_create_date = 'input_create_date'
            const input_create_by = 'input_create_by'
            const input_fincode = 'input_fincode'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_formular_id, Int, id)
                .input(input_formular_name, NVarChar, (prm.formular_name != undefined) ? prm.formular_name : '')
                .input(input_account_code, NVarChar, (prm.account_code != undefined) ? prm.account_code : '')
                .input(input_bu_type, NVarChar, (prm.bu_type != undefined) ? prm.bu_type : '')
                .input(input_type, NVarChar, (prm.type != undefined) ? prm.type : '')
                .input(input_subledger_type, NVarChar, (prm.subledger_type != undefined) ? prm.subledger_type : '')
                .input(input_subledger, NVarChar, (prm.subledger != undefined) ? prm.subledger : '')
                .input(input_create_date, NVarChar, (prm.create_date != undefined) ? prm.create_date : '')
                .input(input_create_by, NVarChar, (prm.create_by != undefined) ? prm.create_by : '')
                .input(input_fincode, NVarChar, (prm.fincode != undefined) ? prm.fincode : '')
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceEditAccountCodeForSale(prm) {
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
            if (prm.fincode != undefined) querysql = [querysql, `FIN_CODE = @input_fincode `].join(",")

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
            const input_fincode = 'input_fincode'

            const pool = await db.poolPromise
            let result = await pool.request()

            if (prm.formular_id != undefined) await result.input(input_formular_id, NVarChar, prm.formular_id)
            if (prm.formular_name != undefined) await result.input(input_formular_name, NVarChar, prm.formular_name)
            if (prm.account_code != undefined) await result.input(input_account_code, NVarChar, prm.account_code)
            if (prm.bu_type != undefined) await result.input(input_bu_type, NVarChar, prm.bu_type)
            if (prm.type != undefined) await result.input(input_type, NVarChar, prm.type)
            if (prm.subledger_type != undefined) await result.input(input_subledger_type, NVarChar, prm.subledger_type)
            if (prm.subledger != undefined) await result.input(input_subledger, NVarChar, prm.subledger)
            if (prm.update_date != undefined) await result.input(input_update_date, NVarChar, prm.update_date)
            if (prm.update_by != undefined) await result.input(input_update_by, NVarChar, prm.update_by)
            if (prm.fincode != undefined) await result.input(input_fincode, NVarChar, prm.fincode)
            result = await result.query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetDropDownBuType() {
    let res = {}
    try {
        let querysql = `SELECT LOV1 FROM LOV_DATA 
        WHERE LOV_GROUP = 'SDC' 
        AND LOV_TYPE = 'SALES' 
        AND LOV_CODE = 'BU_TYPE' 
        ORDER BY LOV1 ASC`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetDropDownType() {
    let res = {}
    try {
        let querysql = `SELECT LOV1 FROM LOV_DATA 
        WHERE LOV_GROUP = 'SDC' 
        AND LOV_TYPE = 'SALES' 
        AND LOV_CODE = 'ACC_TYPE' 
        ORDER BY LOV1 ASC`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceCheckDuplicateAccountCodeForSale(formular_name) {
    let res = true
    try {
        let querysql = `SELECT * FROM  ACC_M_ACCOUNT_SALE WHERE  FORMULARNAME = @input_formular_name`

        const input_formular_name = 'input_formular_name'

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_formular_name, NVarChar, formular_name.trim())
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServiceCheckEditDuplicateAccountCodeForSale(prm) {
    let res = true
    try {
        let querysql = `SELECT * FROM   ACC_M_ACCOUNT_SALE WHERE 1=1 `
        if (prm.formular_id != undefined) querysql += `AND FORMULARID <> @input_formular_id `
        if (prm.formular_name != undefined) querysql += `AND FORMULARNAME = @input_formular_name `

        const input_formular_id = 'input_formular_id'
        const input_formular_name = 'input_formular_name'

        const pool = await db.poolPromise
        let result = await pool.request()
        if (prm.formular_id != undefined) await result.input(input_formular_id, NVarChar, prm.formular_id.trim())
        if (prm.formular_name != undefined) await result.input(input_formular_name, NVarChar, prm.formular_name.trim())
        result = await result.query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}


////////////////////////  BankInAdjustment  //////////////////////// 
async function ServiceGetPopupStoreBankInAdjustment() {
    let res = {}
    try {
        let querysql = ` SELECT STORE_ID,STORE_NAME 
                        FROM PH_STORES 
                        WHERE COMPANY = 'Y' 
                        ORDER BY STORE_ID ASC;`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetValidationstoreBankInAdjustment() {
    let res = {}
    try {
        let querysql = `SELECT STORE_ID,
                            STORE_NAME 
                        FROM   PH_STORES  
                        WHERE  COMPANY = 'Y' `

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetValidationfinancialcodeBankInAdjustment() {
    let res = {}
    try {
        let querysql = `SELECT F.FINANCIAL_CODE 
                        FROM   ACC_M_FINANCIAL_CODES F 
                        WHERE  F.FIXFLAG = 1`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}
async function ServiceGetBankInAdjustment(store, dateofstore) {
    let result
    try {
        const querysql = `SELECT D.STORE, 
                                D.FINANCIAL_DATE, 
                                D.FINANCIAL_CODE, 
                                FINANCIAL_DESC, 
                                D.DAILY_FIN, 
                                D.S_DAILY_FIN, 
                                CASE 
                                WHEN F.FIXFLAG = 0 THEN 'N' 
                                ELSE 'Y' 
                                END CAN_EDIT 
                        FROM   ACC_DAILY_FINS D 
                                INNER JOIN ACC_M_FINANCIAL_CODES F 
                                        ON D.FINANCIAL_CODE = F.FINANCIAL_CODE                                 
                        WHERE   F.S_DAILY_FINS_FLAG = 1
                                AND D.FINANCIAL_DATE = @input_dateofstore
                                AND D.STORE = @input_store
                        ORDER  BY D.STORE, 
                                D.FINANCIAL_DATE, 
                                D.FINANCIAL_CODE ASC `
        // input parameter       
        const input_store = 'input_store'
        const input_dateofstore = 'input_dateofstore'

        const pool = await db.poolPromise
        let result = await pool.request()
            // set parameter
            .input(input_store, NVarChar, store.trim())
            .input(input_dateofstore, NVarChar, dateofstore.trim())
            .query(querysql)
        // await close()

    } catch (err) {
    }
    return await result
}

async function ServiceGetDailyFinsByData(obj) {
    let res
    try {
        let querysql = `SELECT store, 
                            financial_code, 
                            Format(financial_date, 'MM/dd/yyyy hh:mm:ss tt') AS FINANCIAL_DATE, 
                            daily_fin, 
                            s_daily_fin, 
                            Format(create_date, 'MM/dd/yyyy hh:mm:ss tt')    AS CREATE_DATE, 
                            create_by, 
                            Format(update_date, 'MM/dd/yyyy hh:mm:ss tt')    AS UPDATE_DATE, 
                            update_by, 
                            lastupdateby, 
                            remark_code, 
                            remark_text, 
                            mod_flag 
                    FROM   acc_daily_fins 
                    WHERE STORE = @input_store_id AND FINANCIAL_CODE = @input_fin_code AND FINANCIAL_DATE = @input_fin_date `
        const input_store_id = 'input_store_id'
        const input_fin_code = 'input_fin_code'
        const input_fin_date = 'input_fin_date'
        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_store_id, NVarChar, obj.store_id)
            .input(input_fin_code, NVarChar, obj.fin_code)
            .input(input_fin_date, NVarChar, obj.fin_date)
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServiceEditBankInAdjustment(prm) {
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

            const pool = await db.poolPromise
            let result = await pool.request()
            if (prm.store_id != undefined) await result.input(input_store_id, NVarChar, prm.store_id.trim())
            if (prm.fin_code != undefined) await result.input(input_fin_code, NVarChar, prm.fin_code.trim())
            if (prm.fin_date != undefined) await result.input(input_fin_date, NVarChar, prm.fin_date.trim())
            if (prm.daily_fin != undefined) await result.input(input_daily_fin, NVarChar, prm.daily_fin.trim())
            if (prm.store_daily_fin != undefined) await result.input(input_store_daily_fin, NVarChar, prm.store_daily_fin.trim())
            if (prm.update_date != undefined) await result.input(input_update_date, NVarChar, prm.update_date.trim())
            if (prm.update_by != undefined) await result.input(input_update_by, NVarChar, prm.update_by.trim())
            result = await result.query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

//GenGLBankInAdjustment
async function ServiceGenGLBankInAdjustment(prm) {
    let res

    try {
        if (prm) {
            const p_doc_type = 'p_doc_type'
            const p_ledger_type = 'p_ledger_type'
            const p_from_date = 'p_from_date'
            const p_to_date = 'p_to_date'
            const p_from_store = 'p_from_store'
            const p_to_store = 'p_to_store'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(p_doc_type, NVarChar, prm.gldoc_type)
                .input(p_ledger_type, NVarChar, prm.glledger_type)
                .input(p_from_date, NVarChar, prm.glfrom_date)
                .input(p_to_date, NVarChar, prm.glto_date)
                .input(p_from_store, NVarChar, prm.glfrom_store)
                .input(p_to_store, NVarChar, prm.glto_store)
                .execute('GEN_GL_TO_E1')
            if (result !== undefined) {
                res = result.recordset
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

////////////////////////  StampCloseDaiyFins  //////////////////////// 
async function ServiceSearchTempStampCloseDaiyFins(prm) {
    let res = {}
    try {
        let querysql = ` SELECT table_name, 
                            owner, 
                            Format(start_date, 'MM/dd/yyyy hh:mm:ss tt')  AS START_DATE, 
                            Format(end_date, 'MM/dd/yyyy hh:mm:ss tt')    AS END_DATE, 
                            Format(create_date, 'MM/dd/yyyy hh:mm:ss tt') AS CREATE_DATE, 
                            create_by, 
                            Format(update_date, 'MM/dd/yyyy hh:mm:ss tt') AS UPDATE_DATE, 
                            update_by, 
                            lastupdate_by, 
                            status 
                    FROM   acc_stampclosedata  
                    WHERE TABLE_NAME = 'DAILY_FINS'
                        AND START_DATE = @input_datefrom
                        AND END_DATE = @input_dateto
                        AND STATUS = 'A' `

        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_datefrom, NVarChar, prm.datefrom)
            .input(input_dateto, NVarChar, prm.dateto)
            .query(querysql)
        res = result
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

async function ServiceSearchTempReCloseDaiyFins(prm) {
    let res = {}
    try {
        let querysql = ` SELECT * FROM ACC_STAMPCLOSEDATA 
            WHERE TABLE_NAME = 'DAILY_FINS'
                AND START_DATE = @input_datefrom
                AND END_DATE = @input_dateto
                AND STATUS = 'T' `

        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_datefrom, NVarChar, prm.datefrom.trim())
            .input(input_dateto, NVarChar, prm.dateto.trim())
            .query(querysql)
        res = result
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

async function ServiceCountStampCloseDaiyFins(prm) {
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

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_datefrom, NVarChar, prm.datefrom.trim())
            .input(input_dateto, NVarChar, prm.dateto.trim())
            .query(querysql)
        res = result

    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceAddStampCloseDaiyFins(prm) {
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

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_user_id, NVarChar, prm.owner)
                .input(input_datefrom, NVarChar, prm.datefrom)
                .input(input_dateto, NVarChar, prm.dateto)
                .input(input_create_date, NVarChar, prm.create_date)
                .input(input_create_by, NVarChar, prm.create_by)
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceEditStampCloseDaiyFins(prm) {
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

            const pool = await db.poolPromise
            let result = await pool.request()  
                .input(input_datefrom, NVarChar, prm.datefrom)
                .input(input_dateto, NVarChar, prm.dateto)
                .input(input_update_date, NVarChar, prm.update_date)
                .input(input_update_by, NVarChar, prm.update_by)
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceExportReportDailyFlashSales(prm) {
    let res

    try {
        if (prm) {
            const p_from_date = 'p_from_date'
            const p_to_date = 'p_to_date'
            const p_from_store = 'p_from_store'
            const p_to_store = 'p_to_store'

            const pool = await db.poolPromise
            let result = await pool.request()  
            result.multiple = true
            await result.input(p_from_date, NVarChar, prm.datefrom)
            await result.input(p_to_date, NVarChar, prm.dateto)
            await result.input(p_from_store, NVarChar, prm.from_store)
            await result.input(p_to_store, NVarChar, prm.to_store)
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
        // await close()
    }
    return await res
}

////////////////////////  Gen Data File P&L  ////////////////////////
async function ServiceInsertPLBalE1(prm) {
    let res
    try {
        if (prm) {
            const querysql = `INSERT INTO PL_BAL_E1
                            (DESCRIPTION, 
                            E1ACCCODE, 
                            AMOUNT,
                            PER_CENT,
                            COSTCENTER,
                            PERIOD_MONTH,
                            PERIOD_YEAR) 
                VALUES      (@input_description, 
                            @input_e1acccode, 
                            @input_amount, 
                            @input_per_cent, 
                            @input_costcenter,
                            @input_period_month,
                            @input_period_year) `

            const input_description = 'input_description'
            const input_e1acccode = 'input_e1acccode'
            const input_amount = 'input_amount'
            const input_per_cent = 'input_per_cent'
            const input_costcenter = 'input_costcenter'
            const input_period_month = 'input_period_month'
            const input_period_year = 'input_period_year'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_description, NVarChar, prm.description)
                .input(input_e1acccode, NVarChar, prm.e1acccode)
                .input(input_amount, NVarChar, prm.amount)
                .input(input_per_cent, NVarChar, prm.per_cent)
                .input(input_costcenter, NVarChar, prm.costcenter)
                .input(input_period_month, NVarChar, prm.period_month)
                .input(input_period_year, NVarChar, prm.period_year)
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

async function ServiceDeletePLBalE1(prm) {
    let res
    try {
        if (prm) {
            let querysql = `DELETE PL_BAL_E1
            WHERE  PERIOD_MONTH = @input_period_month 
                AND PERIOD_YEAR = @input_period_year`

            const input_period_month = 'input_period_month'
            const input_period_year = 'input_period_year'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_period_month, NVarChar, prm.period_month)
                .input(input_period_year, NVarChar, prm.period_year)
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res

}

async function ServicePLBalE1_BALFile(prm) {
    let res
    try {
        if (prm) {
            let querysql = `SELECT Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                        RIGHT([costcenter], Len([costcenter]) - 3), 
                                        RIGHT([costcenter], Len([costcenter]) - 4)) AS CC, 
                                B.description, 
                                M.acccode, 
                                Sum(B.amount)                                      AS Amt, 
                                '00.00%'                                           AS Per_cent, 
                                M.accone1, 
                                B.e1acccode, 
                                M.acccode 
                            FROM   pl_bal_e1 B 
                                INNER JOIN pl_masteracccodematche1 M 
                                        ON B.e1acccode = M.accone1
                            WHERE B.PERIOD_MONTH = @input_period_month AND B.PERIOD_YEAR = @input_period_year 
                            GROUP  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    B.description, 
                                    M.accone1, 
                                    B.e1acccode, 
                                    M.acccode, 
                                    M.acccode 
                            ORDER  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    M.acccode`

            const input_period_month = 'input_period_month'
            const input_period_year = 'input_period_year'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_period_month, NVarChar, prm.period_month)
                .input(input_period_year, NVarChar, prm.period_year)
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = result
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServicePLBalE1_BAL_ADJFile(prm) {
    let res
    try {
        if (prm) {
            let querysql = `SELECT Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                        RIGHT([costcenter], Len([costcenter]) - 3), 
                                        RIGHT([costcenter], Len([costcenter]) - 4)) AS CC, 
                                B.description, 
                                B.e1acccode, 
                                M.acccode, 
                                Sum(B.amount)                                 AS Amt, 
                                '0.00%'                                            AS Per_cent, 
                                M.bal_adj 
                            FROM   pl_bal_e1 B
                                INNER JOIN pl_masteracccodematche1 M
                                        ON B.e1acccode = M.accone1 
                            WHERE B.PERIOD_MONTH = @input_period_month AND B.PERIOD_YEAR = @input_period_year
                            GROUP  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    B.description, 
                                    B.e1acccode, 
                                    M.acccode, 
                                    M.bal_adj 
                            HAVING    M.bal_adj = 'y' 
                            ORDER  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    M.acccode`

            const input_period_month = 'input_period_month'
            const input_period_year = 'input_period_year'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_period_month, NVarChar, prm.period_month)
                .input(input_period_year, NVarChar, prm.period_year)
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = result
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServicePLBalE1_ACTUALFile(prm) {
    let res
    try {
        if (prm) {
            let querysql = `SELECT Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                        RIGHT([costcenter], Len([costcenter]) - 3), 
                                        RIGHT([costcenter], Len([costcenter]) - 4)) AS CC, 
                                B.description, 
                                B.e1acccode, 
                                M.acccode, 
                                Sum(B.amount)                                 AS Amt, 
                                '0.00%'                                            AS Per_cent, 
                                M.actual 
                            FROM   pl_masteracccodematche1 M
                                INNER JOIN pl_bal_e1 B
                                        ON M.accone1 = B.e1acccode 
                            WHERE B.PERIOD_MONTH = @input_period_month AND B.PERIOD_YEAR = @input_period_year
                            GROUP  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    B.description, 
                                    B.e1acccode, 
                                    M.acccode, 
                                    M.actual 
                            HAVING    M.actual = 'y' 
                            ORDER  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    M.acccode`

            const input_period_month = 'input_period_month'
            const input_period_year = 'input_period_year'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_period_month, NVarChar, prm.period_month)
                .input(input_period_year, NVarChar, prm.period_year)
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = result
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServicePLBalE1_ACTUAL_ADJFile(prm) {
    let res
    try {
        if (prm) {
            let querysql = `SELECT Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                        RIGHT([costcenter], Len([costcenter]) - 3), 
                                        RIGHT([costcenter], Len([costcenter]) - 4)) AS CC, 
                                B.description, 
                                B.e1acccode, 
                                M.acccode, 
                                Sum(B.amount)                                 AS Amt, 
                                '0.00%'                                            AS Per_cent, 
                                M.actual_adj 
                            FROM   pl_bal_e1 B 
                                INNER JOIN pl_masteracccodematche1 M 
                                        ON B.e1acccode = M.accone1
                            WHERE B.PERIOD_MONTH = @input_period_month AND B.PERIOD_YEAR = @input_period_year 
                            GROUP  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    B.description, 
                                    B.e1acccode, 
                                    M.acccode, 
                                    M.actual_adj 
                            HAVING    M.actual_adj = 'y'
                            ORDER  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4)), 
                                    M.acccode`

            const input_period_month = 'input_period_month'
            const input_period_year = 'input_period_year'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_period_month, NVarChar, prm.period_month)
                .input(input_period_year, NVarChar, prm.period_year)
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = result
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServicePLBalE1_NetSalesFile(prm) {
    let res
    try {
        if (prm) {
            let querysql = `SELECT 'net sales'                                                 AS 
                                Description, 
                                Sum(B.amount)                                                  AS 
                                Amt, 
                                '0.00'                                                              AS 
                                Per_cent, 
                                Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                RIGHT([costcenter], Len([costcenter]) - 3), RIGHT([costcenter], 
                                                                            Len([costcenter]) - 4)) AS CC 
                                ,M.netsales 
                        FROM   pl_masteracccodematche1 M 
                                INNER JOIN pl_bal_e1 B 
                                        ON M.accone1 = B.e1acccode 
                        WHERE B.PERIOD_MONTH = @input_period_month AND B.PERIOD_YEAR = @input_period_year
                        GROUP  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                RIGHT([costcenter], Len([costcenter]) - 3), RIGHT([costcenter], 
                                                                            Len([costcenter]) - 4)), 
                                M.netsales 
                        HAVING    M.netsales = 'y' 
                        ORDER  BY Iif(LEFT([costcenter], 4) IN ( 6641, 6645 ), 
                                            RIGHT([costcenter], Len([costcenter]) - 3), 
                                            RIGHT([costcenter], Len([costcenter]) - 4))`

            const input_period_month = 'input_period_month'
            const input_period_year = 'input_period_year'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_period_month, NVarChar, prm.period_month)
                .input(input_period_year, NVarChar, prm.period_year)
                .query(querysql)

            if (result !== undefined) {
                if (result.rowsAffected > 0) res = result
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServicePLBalE1_ACTUAL_SPA_AND__ACTUAL_ADJ_SPAFile(prm) {
    let res

    try {
        if (prm) {
            const p_month = 'p_month'
            const p_year = 'p_year'

            const pool = await db.poolPromise
            let result = await pool.request()  
                .input(p_month, NVarChar, prm.period_month)
                .input(p_year, NVarChar, prm.period_year)
                .execute('EXPORT_NETSALES_P_AND_L')
            if (result !== undefined) {
                res = result
            }
        }
    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

