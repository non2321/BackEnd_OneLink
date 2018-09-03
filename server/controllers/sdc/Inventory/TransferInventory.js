const Inventory = require('../../../models/Services/Inventory')


module.exports.GetDataTable = GetDataTable

async function GetDataTable(req, res, reqBody) {
    if (req.params.stamp == null) throw new Error("Input not valid")
    if (req.params.store == null) throw new Error("Input not valid")


    const stamp = req.params.stamp.toString().trim()
    const store = req.params.store.toString().trim()
    const datefrom = req.params.datefrom.toString().trim()
    const dateto = req.params.dateto.toString().trim()

    try {
        const prm = {
            stamp: stamp,
            store: store,
            datefrom: (datefrom == 'undefined') ? undefined : datefrom,
            dateto: (dateto == 'undefined') ? undefined : dateto
        }
        const result = await Inventory.GetTransferInventory(prm)
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}
