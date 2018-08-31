const sql = require('mssql') // MS Sql Server client
const uuid = require('uuid/v1');

const settings = require('../../../settings')
const digit = require('../digit_number')
const utils = require('../../models/Services/utils')

//Account Code For Inventory
module.exports.GetAccountCodeForInventory = GetAccountCodeForInventory
module.exports.GetDropDownGrpBy = GetDropDownGrpBy
module.exports.GetDropDownCatCode = GetDropDownCatCode
module.exports.GetDropDownAccType = GetDropDownAccType
module.exports.CheckDuplicateAccountCodeForInventory = CheckDuplicateAccountCodeForInventory
module.exports.InsertAccountCodeForInventory = InsertAccountCodeForInventory
module.exports.GetTempAccountCodeForInventory = GetTempAccountCodeForInventory
module.exports.EditAccountCodeForInventory = EditAccountCodeForInventory

//Ending Inventory
module.exports.GetEndingInventory = GetEndingInventory
module.exports.GetEndingInventoryPeriod = GetEndingInventoryPeriod

//Receipts
module.exports.GetReceipts = GetReceipts


//Import To JDE
module.exports.GetDropDownPeriod = GetDropDownPeriod

//Stamp Inventory
module.exports.SearchTempStampInventory = SearchTempStampInventory
module.exports.CountStampInventory = CountStampInventory
module.exports.AddStampInventory = AddStampInventory
module.exports.EditStampInventory = EditStampInventory

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

async function GetEndingInventory(prm) {
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
            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_store, sql.NVarChar, prm.store)
                .input(input_period, sql.NVarChar, prm.period)
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
            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_store, sql.NVarChar, prm.store)
                .input(input_diff, sql.NVarChar, prm.diff)
                .input(input_period, sql.NVarChar, prm.period)
                .query(querysql)
            res = result
        }
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetEndingInventoryPeriod(prm) {
    let res = {}
    try {
        let querysql = `SELECT PERIOD_ID  
                    FROM [PHCDB_DEV].[dbo].[ACC_PERIODS] 
                    WHERE MONTH(PE_DATE) = @input_month AND YEAR(PE_DATE) = @input_year `

        const input_month = 'input_month'
        const input_year = 'input_year'

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_month, sql.NVarChar, prm.month)
            .input(input_year, sql.NVarChar, prm.year)
            .query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function GetReceipts(prm) {
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

        let pool = await sql.connect(settings.dbConfig)

        let result = await pool.request()
        await result.input(input_store, sql.NVarChar, prm.store)
        await result.input(input_datefrom, sql.NVarChar, prm.datefrom)
        await result.input(input_dateto, sql.NVarChar, prm.dateto)
        if (prm.invoice != undefined) await result.input(input_invoice, sql.NVarChar, prm.invoice)
        res = await result.query(querysql)
    } catch (err) {
    } finally {
        await sql.close()
    }
    return res
}

async function GetDropDownPeriod() {
    let res = {}
    try {
        let querysql = `SELECT DISTINCT PERIOD_ID, 
                Format(PE_DATE, 'dd/MM/yyyy') AS Expr1, 
                YEAR_ID 
        FROM ACC_PERIODS`

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request().query(querysql)
        res = result
    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function SearchTempStampInventory(prm) {
    let res = {}
    try {
        let querysql = ` SELECT * FROM ACC_STAMPCLOSEDATA 
            WHERE TABLE_NAME = @input_post_date_type
                AND START_DATE = @input_datefrom
                AND END_DATE = @input_dateto
                AND STATUS = 'A' `

        const input_post_date_type = 'input_post_date_type'
        const input_datefrom = 'input_datefrom'
        const input_dateto = 'input_dateto'
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_post_date_type, sql.NVarChar, prm.post_date_type)
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

async function CountStampInventory(prm) {
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

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_datefrom, sql.NVarChar, prm.datefrom)
            .input(input_dateto, sql.NVarChar, prm.dateto)
            .input(input_post_date_type, sql.NVarChar, prm.post_date_type)
            .query(querysql)
        res = result

    } catch (err) {
    } finally {
        await sql.close()
    }
    return await res
}

async function AddStampInventory(prm) {
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

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_post_date_type, sql.NVarChar, prm.post_date_type)
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

async function EditStampInventory(prm) {
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

            let pool = await sql.connect(settings.dbConfig)
            let result = await pool.request()
                .input(input_datefrom, sql.NVarChar, prm.datefrom)
                .input(input_dateto, sql.NVarChar, prm.dateto)
                .input(input_update_date, sql.NVarChar, prm.update_date)
                .input(input_update_by, sql.NVarChar, prm.update_by)
                .input(input_post_date_type, sql.NVarChar, prm.post_date_type)
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




