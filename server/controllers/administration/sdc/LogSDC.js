import { ServiceGetLogSDC } from '../../../models/Services/Administration';

export { GetDataTableLogSDC }

async function GetDataTableLogSDC(req, res, reqBody) {
    try {      
        if (req.params.datefrom == null) throw new Error("Input not valid")
        if (req.params.dateto == null) throw new Error("Input not valid")       

        const prm = {         
            datefrom: req.params.datefrom.toString().trim(),
            dateto: req.params.dateto.toString().trim(),          
        }
       
        const result = await ServiceGetLogSDC(prm)
      
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}