const browserdetect = require('browser-detect');

const settings = require('../../../settings')
const log = require('../../models/Services/Log')
const message = require('../../models/Services/Messsage')

const action_type = require('../../models/action_type')
const status_type = require('../../models/status_type')
const module_type = require('../../models/module_type')
const msg_type = require('../../models/msg_type')

module.exports.Logout = Logout;  

async function Logout(req, res, reqBody, authData)  {
    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        const prmLog = {
            audit_trail_date: datetime,
            module: module_type.OneLink,
            screen_name: '',
            action_type: action_type.Logout,
            status: status_type.Success,
            user_id: authData.id,
            client_ip: req.ip,
            msg: `${msg_type.LogoutSuccess}`,
            browser: browser,
        }

        //Add Log.
        await log.InsertLogAuditTrail(prmLog)

        const data = {
            "status": status_type.Complate,
            "message": msg_type.LogoutSuccess,
          }
          await res.setHeader('Content-Type', 'application/json')
          await res.send(JSON.stringify(data))
      
     
    } catch (err) {       
        res.sendStatus(500)
    }
}


