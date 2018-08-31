const Inventory = require('../../../models/Services/Inventory')

module.exports.GetDataTable = GetDataTable
module.exports.GetPeriod = GetPeriod

async function GetDataTable(req, res, reqBody) {
    if (req.params.stamp == null) throw new Error("Input not valid")
    if (req.params.store == null) throw new Error("Input not valid")
    if (req.params.diff == null) throw new Error("Input not valid")  
    if (req.params.period == null) throw new Error("Input not valid")

    const stamp =req.params.stamp.toString().trim()
    const store = req.params.store.toString().trim()
    const diff = req.params.diff.toString().trim()    
    const period = req.params.period.toString().trim()

    try {
        const prm = {
            stamp: stamp,
            store: store,
            diff: diff,           
            period: period
        }
        const result = await Inventory.GetEndingInventory(prm)
        const rowdata = {
            "aaData": result.recordset
        }        
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
       res.sendStatus(500)
    }
}

async function GetPeriod(req, res, reqBody) {
    if (req.params.year == null) throw new Error("Input not valid")
    if (req.params.month == null) throw new Error("Input not valid")

    const year = req.params.year.toString()
    const month = req.params.month.toString()

    try {
        const prm = {
             year : year ,
             month : month
        }
        let result = await Inventory.GetEndingInventoryPeriod(prm)
        
        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['PERIOD_ID'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}