const sql = require('mssql') // MS Sql Server client
const settings = require('../../../settings')

const module_type = require('../../models/module_type')

const menu = require('../../models/Services/Menu')

module.exports.Menu = Menu;  

async function Menu(req, res, reqBody) {
    try {
        if (req.params.userid == null) throw new Error("Input not valid")

        let userid = req.params.userid

        let result = await menu.GetMenuByUserID(userid)
        
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
