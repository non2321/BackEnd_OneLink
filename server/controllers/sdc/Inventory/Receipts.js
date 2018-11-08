import { ServiceGetReceipts } from '../../../models/Services/Inventory';

export { GetDataTableReceipts };

async function GetDataTableReceipts(req, res, reqBody) {
    try {
        if (req.params.store == null) throw new Error("Input not valid")
        if (req.params.datefrom == null) throw new Error("Input not valid")
        if (req.params.dateto == null) throw new Error("Input not valid")       

        const prm = {
            store: req.params.store.toString().trim(),
            datefrom: req.params.datefrom.toString().trim(),
            dateto: req.params.dateto.toString().trim(),
            invoice: (req.params.invoice) ? req.params.invoice.toString().trim() : undefined
        }
       
        const result = await ServiceGetReceipts(prm)
      
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}