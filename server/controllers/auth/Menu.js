import { ServiceGetMenuByUserID, ServiceGetRoleDataByUserID } from '../../models/Services/Menu';

export { Menu, RoleData };  

async function Menu(req, res, reqBody) {
    try {
        if (req.params.userid == null) throw new Error("Input not valid")

        let userid = req.params.userid

        let result = await ServiceGetMenuByUserID(userid)
        
        if (result.rowsAffected > 0) {
            await res.setHeader('Content-Type', 'application/json')
            await res.send(JSON.stringify(result.recordset))
        } else {
            await res.send('OK');
        }
    } catch (err) {   
       res.sendStatus(500)     
    }
}

async function RoleData(req, res, reqBody) {
    try {
        if (req.params.userid == null) throw new Error("Input not valid")
        let userid = req.params.userid
        let result = await ServiceGetRoleDataByUserID(userid)
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(result));
    } catch (err) {
        res.sendStatus(500)
    }
}
