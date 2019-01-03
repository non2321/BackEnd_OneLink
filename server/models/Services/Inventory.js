import { connect, close, NVarChar, Int, Date } from 'mssql'; // MS Sql Server client
import db from '../db'

export {
    //Account Code For Inventory
    ServiceGetAccountCodeForInventory,
    ServiceGetDropDownGrpBy,
    ServiceGetDropDownCatCode,
    ServiceGetDropDownAccType,
    ServiceCheckDuplicateAccountCodeForInventory,
    ServiceInsertAccountCodeForInventory,
    ServiceGetTempAccountCodeForInventory,
    ServiceEditAccountCodeForInventory,
    ServiceGetValidationAccountCodeForInventory,

    //Ending Inventory
    ServiceGetEndingInventory,
    ServiceGetEndingInventoryPeriod,

    //Receipts,
    ServiceGetReceipts,

    //Term Closing
    ServiceGetTermClosing,
    ServiceGetTermClosingById,
    ServiceCheckDuplicateTermClosing,
    ServiceCheckPeriodsTermClosing,
    ServiceGetTermClosingForInsert,
    ServiceInsertTermClosing,
    ServiceEditTermClosing,
    ServiceGenUnitCost,

    //Transfer Inventory
    ServiceGetTransferInventory,

    //UnitCost
    ServiceGetDropDownPeriod,
    ServiceGetUnitCost,
    ServiceGetUnitCostDropDownInvenCategory,
    ServiceGetUnitCostByData,
    ServiceEditUnitCost,
    ServiceGetValidationInvItemUnitCost,

    //Stamp Inventory
    ServiceSearchTempStampInventory,
    ServiceCountStampInventory,
    ServiceAddStampInventory,
    ServiceEditStampInventory
}


async function ServiceGetAccountCodeForInventory() {
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

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result

    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetDropDownGrpBy() {
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

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetDropDownCatCode() {
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

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetDropDownAccType() {
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

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceCheckDuplicateAccountCodeForInventory(prm) {
    let res = true
    try {
        let querysql = `SELECT * FROM ACC_M_ACCOUNT_INVEN 
                    WHERE ACTIONCODE = @input_actioncode 
                    AND INV_CLASS = @input_inv_class 
                    AND ACCTYPE = @input_acctype`

        const input_actioncode = 'input_actioncode'
        const input_inv_class = 'input_inv_class'
        const input_acctype = 'input_acctype'

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_actioncode, NVarChar, prm.action_code.trim())
            .input(input_inv_class, NVarChar, prm.inv_class.trim())
            .input(input_acctype, NVarChar, prm.acc_type.trim())
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

async function ServiceInsertAccountCodeForInventory(prm) {
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

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_action_code, NVarChar, prm.action_code)
                .input(input_inv_class, NVarChar, prm.inv_class)
                .input(input_action, NVarChar, prm.action)
                .input(input_obj_account, NVarChar, prm.obj_account)
                .input(input_subsidary, NVarChar, prm.subsidary)
                .input(input_grp_by, NVarChar, prm.grp_by)
                .input(input_cat_code, NVarChar, prm.cat_code)
                .input(input_acc_type, NVarChar, prm.acc_type)
                .input(input_doc_no, NVarChar, prm.doc_no)
                .input(input_remark, NVarChar, prm.remark)
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

async function ServiceGetTempAccountCodeForInventory(prm) {
    let res = {}
    try {
        if (prm.action_code && prm.inv_class && prm.acc_type) {
            let querysql = `SELECT actioncode, 
                    inv_class, 
                    action, 
                    objaccout, 
                    subsidary, 
                    grpby, 
                    catcode, 
                    acctype, 
                    docno, 
                    remark, 
                    Format(create_date, 'MM/dd/yyyy hh:mm:ss tt') AS CREATE_DATE, 
                    create_by, 
                    Format(update_date, 'MM/dd/yyyy hh:mm:ss tt') AS UPDATE_DATE, 
                    update_by 
            FROM   acc_m_account_inven  
            WHERE  actioncode = @input_action_code 
                AND inv_class = @input_inv_class 
                AND acctype = @input_acc_type`

            const input_action_code = 'input_action_code'
            const input_inv_class = 'input_inv_class'
            const input_acc_type = 'input_acc_type'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_action_code, NVarChar, prm.action_code)
                .input(input_inv_class, NVarChar, prm.inv_class)
                .input(input_acc_type, NVarChar, prm.acc_type)
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

async function ServiceEditAccountCodeForInventory(prm) {
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

            const pool = await db.poolPromise
            let result = await pool.request()

            if (prm.action_code != undefined) await result.input(input_action_code, NVarChar, prm.action_code)
            if (prm.inv_class != undefined) await result.input(input_inv_class, NVarChar, prm.inv_class)
            if (prm.action != undefined) await result.input(input_action, NVarChar, prm.action)
            if (prm.obj_account != undefined) await result.input(input_obj_account, NVarChar, prm.obj_account)
            if (prm.subsidary != undefined) await result.input(input_subsidary, NVarChar, prm.subsidary)
            if (prm.grp_by != undefined) await result.input(input_grp_by, NVarChar, prm.grp_by)
            if (prm.cat_code != undefined) await result.input(input_cat_code, NVarChar, prm.cat_code)
            if (prm.acc_type != undefined) await result.input(input_acc_type, NVarChar, prm.acc_type)
            if (prm.doc_no != undefined) await result.input(input_doc_no, NVarChar, prm.doc_no)
            if (prm.remark != undefined) await result.input(input_remark, NVarChar, prm.remark)
            if (prm.update_date != undefined) await result.input(input_update_date, NVarChar, prm.update_date)
            if (prm.update_by != undefined) await result.input(input_update_by, NVarChar, prm.update_by)
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

async function ServiceGetValidationAccountCodeForInventory() {
    let res = {}
    try {
        let querysql = `SELECT DISTINCT ACTIONCODE, INV_CLASS, ACCTYPE FROM ACC_M_ACCOUNT_INVEN `

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetEndingInventory(prm) {
    let res = {}
    try {
        if (prm.stamp == 'option1') {
            let querysql = `SELECT A.STORE_ID, 
                                    A.store_name, 
                                    Isnull(Sum(A.acc), 0) + Isnull(Sum(B.acc), 0) AS ACC, 
                                    Isnull(Sum(A.str), 0) + Isnull(Sum(B.str), 0) AS STR 
                            FROM   (SELECT STORE_ID, 
                                            store_name, 
                                            0 AS ACC, 
                                            0 AS STR 
                                    FROM   PH_STORES 
                                    WHERE  stores_status = 'A' 
                                            AND cfm_store = 'Y' 
                                            AND STORE_ID = @input_store) A 
                                    LEFT OUTER JOIN (SELECT p.store, 
                                                            Sum(P.p_ending_inv)   AS ACC, 
                                                            Sum(P.s_p_ending_inv) AS STR 
                                                    FROM   ACC_PERIODIC_INV p 
                                                            INNER JOIN ACC_INV_ITEMS i 
                                                                    ON p.inv_item = i.inv_item 
                                                            INNER JOIN ACC_M_STOCK_NUMS n 
                                                                    ON p.inv_item = n.inv_item 
                                                            INNER JOIN PH_STORES s 
                                                                    ON p.store = s.STORE_ID 
                                                            INNER JOIN ACC_M_INV_ITEM_CLASSES c 
                                                                    ON i.inv_item_class = c.inv_item_class 
                                                            INNER JOIN ACC_PERIODS r 
                                                                    ON p.period_id = r.period_id 
                                                    WHERE  r.year_id >= 2014 
                                                            AND p.period_id = @input_period 
                                                            AND p.store = @input_store 
                                                    GROUP  BY p.store) B 
                                                ON A.STORE_ID = B.store 
                            GROUP  BY A.STORE_ID, 
                                    A.store_name 
                            HAVING ( Isnull(Sum(A.str), 0) + Isnull(Sum(B.str), 0) = 0 ) `

            const input_store = 'input_store'
            const input_period = 'input_period'
            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_store, NVarChar, prm.store)
                .input(input_period, NVarChar, prm.period)
                .query(querysql)
            res = result
        } else if (prm.stamp == 'option2') {
            let querysql = `SELECT a.inv_item, 
                                        b.store, 
                                        b.store_name, 
                                        b.period_id, 
                                        Isnull(a.p_ending_inv, 0)                               AS p_ending_inv, 
                                        Isnull(a.s_p_ending_inv, 0)                             AS s_p_ending_inv , 
                                        a.inv_item_desc, 
                                        a.stock_num, 
                                        a.inv_item_class, 
                                        a.uom, 
                                        a.class, 
                                        Isnull(a.p_ending_inv, 0) - Isnull(a.s_p_ending_inv, 0) AS diff 
                                FROM   (SELECT p.inv_item, 
                                                p.store, 
                                                s.store_name, 
                                                p.period_id, 
                                                p.p_ending_inv, 
                                                p.s_p_ending_inv, 
                                                i.inv_item_desc, 
                                                n.stock_num, 
                                                i.inv_item_class, 
                                                i.count_desc       AS uom, 
                                                c.inv_item_cl_desc AS Class, 
                                                r.year_id 
                                        FROM   ACC_PERIODIC_INV p 
                                                INNER JOIN ACC_INV_ITEMS i 
                                                        ON p.inv_item = i.inv_item 
                                                INNER JOIN ACC_M_STOCK_NUMS n 
                                                        ON p.inv_item = n.inv_item 
                                                INNER JOIN PH_STORES s 
                                                        ON p.store = s.STORE_ID 
                                                INNER JOIN ACC_M_INV_ITEM_CLASSES c 
                                                        ON i.inv_item_class = c.inv_item_class 
                                                INNER JOIN ACC_PERIODS r 
                                                        ON p.period_id = r.period_id 
                                        WHERE  r.year_id >= 2014) a 
                                        RIGHT OUTER JOIN (SELECT d.store, 
                                                                d.financial_code, 
                                                                p.period_id, 
                                                                s.store_name, 
                                                                Sum(d.daily_fin) AS Expr1 
                                                        FROM   ACC_DAILY_FINS d 
                                                                INNER JOIN PH_STORES s 
                                                                        ON d.store = s.STORE_ID 
                                                                CROSS JOIN ACC_PERIODS p 
                                                        WHERE  d.financial_date BETWEEN p.pb_date AND p.pe_date 
                                                        GROUP  BY d.store, 
                                                                    d.financial_code, 
                                                                    p.period_id, 
                                                                    s.store_name 
                                                        HAVING d.financial_code = 1 
                                                                AND Sum(d.daily_fin) <> 0) b 
                                                    ON a.store = b.store 
                                                        AND a.period_id = b.period_id 
                                WHERE  b.period_id = @input_period
                                        AND b.store = @input_store 
                                        AND (Isnull(a.p_ending_inv, 0) - Isnull(a.s_p_ending_inv, 0)) <> @input_diff
                                ORDER  BY b.store, 
                                        a.stock_num `

            const input_store = 'input_store'
            const input_diff = 'input_diff'
            const input_period = 'input_period'
            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_store, NVarChar, prm.store)
                .input(input_diff, NVarChar, prm.diff)
                .input(input_period, NVarChar, prm.period)
                .query(querysql)
            res = result
        }
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetEndingInventoryPeriod(prm) {
    let res = {}
    try {
        let querysql = `SELECT PERIOD_ID  
                    FROM [PHCDB_DEV].[dbo].[ACC_PERIODS] 
                    WHERE MONTH(PE_DATE) = @input_month AND YEAR(PE_DATE) = @input_year `

        const input_month = 'input_month'
        const input_year = 'input_year'

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_month, NVarChar, prm.month)
            .input(input_year, NVarChar, prm.year)
            .query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetReceipts(prm) {
    let res
    try {
        const querysql = `SELECT S.STORE_ID, 
                                S.STORE_NAME, 
                                N.STOCK_NUM, 
                                R.RECEIPT_DATE, 
                                CONVERT(VARCHAR, R.RECEIPT_DATE, 103) RECEIPT_DATE_DESC, 
                                R.RECEIVED, 
                                R.INVOICE_AMOUNT, 
                                R.INVOICE, 
                                V.VENDOR, 
                                V.VENDOR_NAME, 
                                N.UNITS_DESC, 
                                I.INV_ITEM_DESC, 
                                I.INV_ITEM, 
                                R.RECEIPT, 
                                R.S_RECEIVED, 
                                R.S_INVOICE_AMOUNT 
                        FROM   ACC_RECEIPTS R
                                INNER JOIN PH_STORES S
                                        ON R.STORE = S.STORE_ID 
                                INNER JOIN ACC_M_STOCK_NUMS N
                                        ON R.INV_ITEM = N.INV_ITEM 
                                INNER JOIN ACC_M_VENDORS V
                                        ON R.VENDOR = V.VENDOR 
                                INNER JOIN ACC_INV_ITEMS I
                                        ON R.INV_ITEM = I.INV_ITEM 
                        WHERE  R.STORE = @input_store      
                                        AND R.RECEIPT_DATE BETWEEN @input_datefrom AND @input_dateto 
                               ${(prm.invoice != undefined) ? `AND R.INVOICE LIKE @input_invoice +'%' ` : ''}          
                        ORDER  BY R.RECEIPT_DATE, 
                                R.INVOICE, 
                                N.STOCK_NUM ASC`

        const input_store = 'input_store'
        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        const input_invoice = 'input_invoice'

        const pool = await db.poolPromise
        let result = await pool.request()
        await result.input(input_store, NVarChar, prm.store)
        await result.input(input_datefrom, NVarChar, prm.datefrom)
        await result.input(input_dateto, NVarChar, prm.dateto)
        if (prm.invoice != undefined) await result.input(input_invoice, NVarChar, prm.invoice)
        res = await result.query(querysql)
    } catch (err) {
    } finally {
        // await close()
    }
    return res
}

async function ServiceGetTermClosing() {
    let res
    try {
        const querysql = `SELECT *, 
                                CONVERT(VARCHAR, PB_DATE, 103) PB_DATE_DESC, 
                                CONVERT(VARCHAR, PE_DATE, 103) PE_DATE_DESC 
                        FROM   acc_term_closing 
                        WHERE  term_id > 0 
                        ORDER  BY term_id DESC`
        const pool = await db.poolPromise
        res = await pool.request().query(querysql)

    } catch (err) {
    } finally {
        // await close()
    }
    return res
}

async function ServiceGetTermClosingById(term_id) {
    let res = {}
    try {
        let querysql = `SELECT term_id, 
                            period_id, 
                            Format(pb_date, 'MM/dd/yyyy hh:mm:ss tt')     AS PB_DATE, 
                            Format(pe_date, 'MM/dd/yyyy hh:mm:ss tt')     AS PE_DATE, 
                            Format(create_date, 'MM/dd/yyyy hh:mm:ss tt') AS CREATE_DATE, 
                            create_by, 
                            Format(update_date, 'MM/dd/yyyy hh:mm:ss tt') AS UPDATE_DATE, 
                            update_by 
                    FROM   acc_term_closing 
                    WHERE TERM_ID = @input_term_id `
        const input_term_id = 'input_term_id'
        const pool = await db.poolPromise
        let result = await pool.request().input(input_term_id, NVarChar, term_id).query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServiceCheckDuplicateTermClosing(prm) {
    let res = true
    try {
        let querysql = `SELECT * FROM ACC_TERM_CLOSING WHERE YEAR(PB_DATE) = @input_year`

        const input_year = 'input_year'

        const pool = await db.poolPromise

        let result = await pool.request()
            .input(input_year, NVarChar, prm.year.trim())
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

async function ServiceCheckPeriodsTermClosing(prm) {
    let res = true
    try {
        let querysql = `SELECT COUNT(*) PERIOSDS FROM ACC_PERIODS 
                        WHERE YEAR_ID = @input_year`

        const input_year = 'input_year'

        const pool = await db.poolPromise

        let result = await pool.request()
            .input(input_year, NVarChar, prm.year.trim())
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) {
                if (result.recordset[0]['PERIOSDS'] != 12) {
                    res = false
                }
            }
        }

    } catch (err) {

    } finally {
        // await close()
    }

    return await res
}

async function ServiceGetTermClosingForInsert(prm) {
    let res
    try {
        let querysql = `SELECT * FROM ACC_PERIODS 
                        WHERE YEAR_ID =  @input_year`

        const input_year = 'input_year'

        const pool = await db.poolPromise

        let result = await pool.request()
            .input(input_year, NVarChar, prm.year.trim())
            .query(querysql)

        if (result !== undefined) {
            if (result.rowsAffected > 0) {
                res = await result.recordset
            }
        }

    } catch (err) {

    } finally {
        // await close()
    }
    return await res
}

async function ServiceInsertTermClosing(prm) {
    let res = false
    try {
        const querysql = `INSERT INTO ACC_TERM_CLOSING 
                                        (TERM_ID,
                                        PERIOD_ID, 
                                        PB_DATE, 
                                        PE_DATE, 
                                        CREATE_DATE, 
                                        CREATE_BY) 
                            VALUES      (@input_term_id, 
                                        @input_period_id,
                                        @input_pb_date,
                                        @input_pe_date,
                                        @input_create_date, 
                                        @input_create_by)`

        const input_term_id = 'input_term_id'
        const input_period_id = 'input_period_id'
        const input_pb_date = 'input_pb_date'
        const input_pe_date = 'input_pe_date'
        const input_create_date = 'input_create_date'
        const input_create_by = 'input_create_by'

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_term_id, Int, prm.term_id)
            .input(input_period_id, Int, prm.period_id)
            .input(input_pb_date, Date, prm.pb_date)
            .input(input_pe_date, Date, prm.pe_date)
            .input(input_create_date, NVarChar, prm.create_date)
            .input(input_create_by, NVarChar, prm.create_by)
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = true
        }
    } catch (err) {
    } finally {
        // await close()
    }

    return await res
}

async function ServiceEditTermClosing(prm) {
    let res
    try {
        if (prm.term_id) {
            let querysql = `UPDATE ACC_TERM_CLOSING  SET TERM_ID = TERM_ID  `

            if (prm.pb_date != undefined) querysql = [querysql, `PB_DATE  = @input_pb_date `].join(",")
            if (prm.pe_date != undefined) querysql = [querysql, `PE_DATE  = @input_pe_date `].join(",")
            if (prm.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prm.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")

            querysql += ` WHERE TERM_ID  = @input_term_id `

            const input_term_id = 'input_term_id'
            const input_pb_date = 'input_pb_date'
            const input_pe_date = 'input_pe_date'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            const pool = await db.poolPromise
            let result = await pool.request()

            if (prm.term_id != undefined) await result.input(input_term_id, NVarChar, prm.term_id.toString().trim())
            if (prm.pb_date != undefined) await result.input(input_pb_date, NVarChar, prm.pb_date.toString().trim())
            if (prm.pe_date != undefined) await result.input(input_pe_date, NVarChar, prm.pe_date.toString().trim())
            if (prm.update_date != undefined) await result.input(input_update_date, NVarChar, prm.update_date.toString().trim())
            if (prm.update_by != undefined) await result.input(input_update_by, NVarChar, prm.update_by.toString().trim())

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

async function ServiceGetTransferInventory(prm) {
    let res = {}
    try {
        let querysql = `SELECT N.STOCK_NUM, 
                                    I.INV_ITEM_DESC, 
                                    ${(prm.stamp == 'option1') ? `CAST(O.DESTINATION AS VARCHAR) + ' - '+ S.STORE_NAME AS DESTINATION,` :
                `CAST(S.STORE_ID AS VARCHAR) + ' - ' + S.STORE_NAME AS SOURCE, `}                                    
                                    I.COUNT_DESC, 
                                    O.NUM_TRANSFERRED, 
                                    O.S_NUM_TRANSFERRED, 
                                    O.COST_PER_COUNT, 
                                    CONVERT(varchar, O.TRANSFER_DATE, 120) AS TRANSFER_DATE                                   
                            FROM   ACC_TRANSFERS_OUT O 
                                    INNER JOIN PH_STORES S 
                                            ON O.STORE = S.STORE_ID
                                    INNER JOIN ACC_INV_ITEMS I 
                                            ON O.INV_ITEM = I.INV_ITEM 
                                    INNER JOIN ACC_M_STOCK_NUMS N 
                                            ON I.INV_ITEM = N.INV_ITEM 
                            WHERE  I.INV_STAT = 'A' 
                                    AND 
                                    ${(prm.stamp == 'option1') ? `O.STORE = @input_store ` : ` O.DESTINATION = @input_store  `}
                                    ${(prm.datefrom || prm.dateto) ?
                (prm.dateto) ? `AND O.TRANSFER_DATE BETWEEN @input_datefrom AND @input_dateto` : (prm.datefrom) ? `AND O.TRANSFER_DATE BETWEEN @input_datefrom AND @input_datefrom ` : `` : ''}                                   
                            ORDER  BY N.STOCK_NUM, 
                                    I.INV_ITEM_DESC, 
                                    O.DESTINATION, 
                                    I.COUNT_DESC ASC; `

        const input_store = 'input_store'
        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_store, NVarChar, prm.store)
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

async function ServiceGetDropDownPeriod() {
    let res = {}
    try {
        let querysql = `SELECT DISTINCT PERIOD_ID, 
                Format(PE_DATE, 'dd/MM/yyyy') AS Expr1, 
                YEAR_ID 
        FROM ACC_PERIODS`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetUnitCost(prm) {
    let res
    try {
        const querysql = `SELECT S.STOCK_NUM, 
                                S.INV_ITEM, 
                                I.INV_ITEM_DESC, 
                                U.UNIT_COST, 
                                U.STOCK_ZONE, 
                                U.COUNT_PER_UNIT, 
                                U.PERIOD_ID, 
                                S.UNITS_DESC AS UOM, 
                                I.INV_ITEM_CLASS 
                        FROM   ACC_M_STOCK_NUMS S 
                                INNER JOIN ACC_UNIT_COST U 
                                        ON S.INV_ITEM = U.INV_ITEM 
                                INNER JOIN ACC_INV_ITEMS I 
                                        ON S.INV_ITEM = I.INV_ITEM 
                        WHERE  U.STOCK_ZONE = 'S1' 
                                AND U.PERIOD_ID = @input_period
                                ${(prm.invencategory != undefined) ? `AND I.INV_ITEM_CLASS = @input_invencategory ` : ''}
                                ${(prm.stockno != undefined) ? `AND S.STOCK_NUM LIKE @input_stockno+'%' ` : ''}                               
                        ORDER  BY S.STOCK_NUM`

        const input_period = 'input_period'
        const input_invencategory = 'input_invencategory'
        const input_stockno = 'input_stockno'

        const pool = await db.poolPromise

        let result = await pool.request()
        await result.input(input_period, NVarChar, prm.period)
        if (prm.invencategory != undefined) await result.input(input_invencategory, NVarChar, prm.invencategory)
        if (prm.stockno != undefined) await result.input(input_stockno, NVarChar, prm.stockno)
        res = await result.query(querysql)
    } catch (err) {
    } finally {
        // await close()
    }
    return res
}

async function ServiceGetUnitCostDropDownInvenCategory() {
    let res = {}
    try {
        let querysql = `SELECT INV_ITEM_CLASS, INV_ITEM_CL_DESC 
                    FROM ACC_M_INV_ITEM_CLASSES ORDER BY INV_ITEM_CLASS ASC`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGetUnitCostByData(obj) {
    let res
    try {
        let querysql = `SELECT period_id, 
                            inv_item, 
                            uom, 
                            unit_cost, 
                            stock_zone, 
                            count_per_unit, 
                            Format(create_date, 'MM/dd/yyyy hh:mm:ss tt') AS CREATE_DATE, 
                            create_by, 
                            Format(update_date, 'MM/dd/yyyy hh:mm:ss tt') AS UPDATE_DATE, 
                            update_by, 
                            lastupdateby 
                    FROM   acc_unit_cost 
                    WHERE PERIOD_ID = @input_period AND INV_ITEM = @input_inv_item `
        const input_period = 'input_period'
        const input_inv_item = 'input_inv_item'

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_period, NVarChar, obj.period)
            .input(input_inv_item, NVarChar, obj.inv_item)
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

async function ServiceEditUnitCost(prm) {
    let res

    try {
        if (prm) {
            let querysql = `UPDATE ACC_UNIT_COST SET  PERIOD_ID=PERIOD_ID `
            if (prm.unitcost != undefined) querysql = [querysql, `UNIT_COST  = @input_unitcost `].join(",")
            if (prm.countunit != undefined) querysql = [querysql, `COUNT_PER_UNIT = @input_countunit `].join(",")
            if (prm.update_date != undefined) querysql = [querysql, `UPDATE_DATE = @input_update_date `].join(",")
            if (prm.update_by != undefined) querysql = [querysql, `UPDATE_BY = @input_update_by `].join(",")
            querysql = [querysql, `LASTUPDATEBY = 'A' `].join(",")
            querysql += `WHERE  PERIOD_ID = @input_period 
                   AND INV_ITEM = @input_inv_item`

            const input_period = 'input_period'
            const input_inv_item = 'input_inv_item'
            const input_unitcost = 'input_unitcost'
            const input_countunit = 'input_countunit'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'

            const pool = await db.poolPromise
            let result = await pool.request()
            if (prm.period != undefined) await result.input(input_period, NVarChar, prm.period.trim())
            if (prm.inv_item != undefined) await result.input(input_inv_item, NVarChar, prm.inv_item.trim())
            if (prm.unitcost != undefined) await result.input(input_unitcost, NVarChar, prm.unitcost.trim())
            if (prm.countunit != undefined) await result.input(input_countunit, NVarChar, prm.countunit.trim())
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

async function ServiceGetValidationInvItemUnitCost() {
    let res = {}
    try {
        let querysql = `SELECT PERIOD_ID
                            ,INV_ITEM     
                        FROM ACC_UNIT_COST`

        const pool = await db.poolPromise
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceGenUnitCost(prm) {
    let res

    try {
        if (prm) {
            const p_period_id = 'p_period_id'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(p_period_id, NVarChar, prm.period)
                .execute('GEN_IVENTORY_TO_E1')
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

async function ServiceSearchTempStampInventory(prm) {
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
            WHERE TABLE_NAME = @input_post_date_type
                AND START_DATE = @input_datefrom
                AND END_DATE = @input_dateto
                AND STATUS = 'A' `

        const input_post_date_type = 'input_post_date_type'
        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_post_date_type, NVarChar, prm.post_date_type)
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

async function ServiceCountStampInventory(prm) {
    let res = {}
    try {
        let querysql = `SELECT * 
                FROM   ACC_STAMPCLOSEDATA 
                WHERE  START_DATE >= @input_datefrom
                    AND END_DATE <= @input_dateto
                    AND STATUS = 'A' 
                    AND TABLE_NAME = @input_post_date_type`
        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        const input_post_date_type = 'input_post_date_type'

        const pool = await db.poolPromise
        let result = await pool.request()
            .input(input_datefrom, NVarChar, prm.datefrom)
            .input(input_dateto, NVarChar, prm.dateto)
            .input(input_post_date_type, NVarChar, prm.post_date_type)
            .query(querysql)
        res = result

    } catch (err) {
    } finally {
        // await close()
    }
    return await res
}

async function ServiceAddStampInventory(prm) {
    let res
    try {
        if (prm.owner && prm.datefrom && prm.post_date_type && prm.dateto && prm.create_date && prm.create_by) {
            const querysql = `INSERT INTO ACC_STAMPCLOSEDATA
                    (TABLE_NAME, 
                        OWNER, 
                        START_DATE, 
                        END_DATE,
                        CREATE_DATE, 
                        CREATE_BY,
                        STATUS) 
            VALUES  (@input_post_date_type, 
                    @input_user_id, 
                    @input_datefrom, 
                    @input_dateto, 
                    @input_create_date, 
                    @input_create_by,
                    'A') `

            const input_post_date_type = 'input_post_date_type'
            const input_user_id = 'input_user_id'
            const input_datefrom = 'input_datefrom'
            const input_dateto = 'input_dateto'
            const input_create_date = 'input_create_date'
            const input_create_by = 'input_create_by'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_post_date_type, NVarChar, prm.post_date_type)
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

async function ServiceEditStampInventory(prm) {
    let res
    try {
        if (prm.datefrom && prm.post_date_type && prm.dateto && prm.update_date && prm.update_by) {

            const querysql = `UPDATE ACC_STAMPCLOSEDATA 
            SET    STATUS = 'I', 
                   UPDATE_DATE = @input_update_date, 
                   UPDATE_BY = @input_update_by                  
            WHERE  START_DATE >= @input_datefrom 
                   AND END_DATE <= @input_dateto 
                   AND STATUS = 'A' 
                   AND TABLE_NAME = @input_post_date_type `

            const input_datefrom = 'input_datefrom'
            const input_dateto = 'input_dateto'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'
            const input_post_date_type = 'input_post_date_type'

            const pool = await db.poolPromise
            let result = await pool.request()
                .input(input_datefrom, NVarChar, prm.datefrom)
                .input(input_dateto, NVarChar, prm.dateto)
                .input(input_update_date, NVarChar, prm.update_date)
                .input(input_update_by, NVarChar, prm.update_by)
                .input(input_post_date_type, NVarChar, prm.post_date_type)
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





