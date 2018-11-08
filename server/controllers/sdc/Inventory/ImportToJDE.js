
import { ServiceGetDropDownPeriod } from '../../../models/Services/Inventory';

export { GetDropDownPeriod };

async function GetDropDownPeriod(req, res, reqBody) {
    try {
        let result = await ServiceGetDropDownPeriod()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['PERIOD_ID'], label: items[item]['Expr1'], year: items[item]['YEAR_ID'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}