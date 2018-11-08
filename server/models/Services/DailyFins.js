import { connect, NVarChar, close } from 'mssql'; // MS Sql Server client

export {
    ServiceDeleteDailyFinsByDate,
    ServicerunDailyFinsByDate
}

async function ServiceDeleteDailyFinsByDate(prm) {
    let res
    try {
        let querysql = `DELETE ACC_DAILY_FINS WHERE FINANCIAL_DATE = @input_fin_date`

        const input_fin_date = 'input_fin_date'

        let pool = await connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_fin_date, NVarChar, prm.fin_date)
            .query(querysql)
        if (result !== undefined) {
            res = true
        }

    } catch (err) {

    } finally {
        await close()
    }

    return await res
}

async function ServicerunDailyFinsByDate(prm) {
    let res = {}
    try {
        let querysql = `INSERT INTO ACC_DAILY_FINS SELECT * FROM [192.168.151.75].[PIZZA].[DBO].[DAILY_FINS] 
        WHERE FINANCIAL_DATE = @input_fin_date)`

        const input_fin_date = 'input_fin_date'

        let pool = await connect(settings.dbConfig)
        let result = await pool.request()
            .input(input_fin_date, NVarChar, prm.fin_date)
            .query(querysql)
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = true
        }

    } catch (err) {

    } finally {
        await close()
    }

    return await res
}