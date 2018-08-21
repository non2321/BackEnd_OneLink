const sql = require('mssql') // MS Sql Server client
const settings = require('../../../settings')

module.exports.FormatNumberLength = FormatNumberLength;
module.exports.GetCountUserId = GetCountUserId;
module.exports.GetCountLOVId = GetCountLOVId;
module.exports.GetCountACC_M_ACCOUNT_SALE = GetCountACC_M_ACCOUNT_SALE;
module.exports.ObjectToString_UpperName = ObjectToString_UpperName;

//Fromat integer to a specific length.
function FormatNumberLength(num, length) {
    var r = "" + num;
    while (r.length < length) {
        r = "0" + r;
    }
    return r;
}

//Count UserID
async function GetCountUserId() {
    let count = 0;
    try {
        const querysql = `SELECT  ISNULL((MAX(CONVERT(INT, CASE WHEN ISNUMERIC(USER_ID) = 1 THEN USER_ID ELSE 0 END))),0) + 1 ID FROM USERS`
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .query(querysql)
        await sql.close()
        if (result.rowsAffected > 0) {
            count = result.recordset[0].ID
        } else {
            count = 0;
        }
    } catch (err) {
        //400 Bad Request
    }

    return count;
}

//Count LOVData
async function GetCountLOVId() {
    let count = 0;
    try {
        const querysql = `SELECT ISNULL((MAX(CONVERT(INT, CASE WHEN ISNUMERIC(LOV_ID) = 1 THEN LOV_ID ELSE 0 END))),0) + 1 ID FROM LOV_DATA `
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .query(querysql)
        await sql.close()
        if (result.rowsAffected > 0) {
            count = result.recordset[0].ID
        } else {
            count = 0;
        }
    } catch (err) {
        //400 Bad Request
    }

    return count;
}

//Count LOVData
async function GetCountACC_M_ACCOUNT_SALE() {
    let count = 0;
    try {
        const querysql = `SELECT ISNULL(MAX(FORMULARID),0) + 1 ID FROM ACC_M_ACCOUNT_SALE`
        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .query(querysql)
        await sql.close()
        if (result.rowsAffected > 0) {
            count = result.recordset[0].ID
        } else {
            count = 0;
        }
    } catch (err) {
        //400 Bad Request
    }

    return count;
}

//Upper ObjectName
async function ObjectToString_UpperName(obj) {
    let res = ''
    let countrow = 0   
    if (obj !== undefined) {
        for (let key in obj) {
            switch (countrow) {
                case 0:
                    res = [res, `${key.toUpperCase()} : "${obj[key]}"`].join("")
                    break
                default:
                    res = [res, `${key.toUpperCase()} : "${obj[key]}"`].join(" , ")
                    break
            }
            countrow++
        }
    }
    return await res
}