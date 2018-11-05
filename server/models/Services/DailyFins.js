const sql = require('mssql') // MS Sql Server client

module.exports.DeleteDailyFinsByDate = DeleteDailyFinsByDate
module.exports.runDailyFinsByDate = runDailyFinsByDate

async function DeleteDailyFinsByDate(prm) {
    let res
    try {
        let querysql = `DELETE ACC_DAILY_FINS WHERE FINANCIAL_DATE = @input_fin_date`

        const input_fin_date = 'input_fin_date'

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_fin_date, sql.NVarChar, prm.fin_date)
            .query(querysql)
        if (result !== undefined) {
            res = true
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}

async function runDailyFinsByDate(prm) {
    let res = {}
    try {
        let querysql = `INSERT INTO ACC_DAILY_FINS SELECT * FROM [192.168.151.75].[PIZZA].[DBO].[DAILY_FINS] 
        WHERE FINANCIAL_DATE = @input_fin_date)`

        const input_fin_date = 'input_fin_date'

        let pool = await sql.connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_fin_date, sql.NVarChar, prm.fin_date)
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = true
        }

    } catch (err) {

    } finally {
        await sql.close()
    }

    return await res
}