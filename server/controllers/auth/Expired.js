const jwt = require('jsonwebtoken');
const jwtDecode = require('jwt-decode');
const browserdetect = require('browser-detect');

const settings = require('../../../settings')
const log = require('../../models/Services/Log')
const message = require('../../models/Services//Messsage')

const action_type = require('../../models/action_type')
const status_type = require('../../models/status_type')
const module_type = require('../../models/module_type')
const msg_type = require('../../models/msg_type')

module.exports.Expired = Expired; 

async function Expired(req, res, data) {
    try {    
        const decoded = (req.token != null) ? jwtDecode(req.token) : null;      
        const authData = (decoded != null) ? decoded.jwtdata : null;
        
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));
     
        //token null equals First Login.
        if(decoded != null){           
            const prmLog = {
                audit_trail_date: datetime,
                module: module_type.OneLink,
                screen_name: module_type.OneLink,
                action_type: action_type.Expired,
                status: status_type.Error,
                user_id: authData.id,
                client_ip: req.ip,
                msg: `${msg_type.AuthTokenExpired}`,
                browser: browser,
            }
            
            //Add Log.            
            await log.InsertLogAuditTrail(prmLog)
        }       
        //Response
        await message.ResponseMsg(res,data);
     
    } catch (err) {      
        res.sendStatus(400)
    }
}

