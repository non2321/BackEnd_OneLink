const sql = require('mssql') // MS Sql Server client
const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect');

const settings = require('../../../settings')

const log = require('../../models/Services/Log')
const menu = require('../../models/Services/Menu')

const msg_type = require('../../models/msg_type')
const action_type = require('../../models/action_type')
const status_type = require('../../models/status_type')


module.exports.Loadpage = Loadpage;

async function Loadpage(req, res, reqBody, authData) {
    try {        
        if (reqBody.screen_id == null) throw new Error("Input not valid")

        const screen_id = reqBody.screen_id
        let screen_name = ''
        let module_name = ''

        //Get Screen name && module
        const screen = await menu.GetScreenById(screen_id)
        if (Object.keys(screen).length > 0) {         
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }
        // Data Modify
        const prm = { user_id: authData.id, screen_id: screen_id }
        const modify = await menu.GetModifyData(prm)

        // Current DateTime
        const datetime = new Date().toLocaleString();
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        const prmLog = {
            audit_trail_date: datetime,
            module: module_name,
            screen_name: screen_name,
            action_type: action_type.LoadPage,
            status: status_type.Success,
            user_id: authData.id,
            client_ip: req.ip,
            msg: `${msg_type.LoadPage} ${screen_name}`,
            browser: browser,
        }

        //Add Log.
        await log.InsertLogAuditTrail(prmLog)

        const jwtdata = {
            id: authData.id,
            firstname: authData.firstname,
            lastname: authData.lastname,
            position: authData.position,
            email: authData.email,
            mobile_no: authData.mobile_no,
            phc_user: authData.phc_user,
        }
        
        await jwt.sign({ jwtdata }, settings.secretkey, { expiresIn: settings.tokenexpires }, (err, token) => {
            res.json({
                "status": status_type.Complate,
                "message": msg_type.AuthSuccess,
                "user": {
                    "id": authData.id,
                    "firstname": authData.firstname,
                    "lastname": authData.lastname,
                    "position": authData.position,
                    "email": authData.email,
                    "mobile_no": authData.mobile_no,
                    "phc_user": authData.phc_user,
                    token
                },    
                "screen_name": screen_name,
                "modify": {
                    can_add: (modify !== undefined)? (modify.V_ADD !== undefined)? modify.V_ADD: 'N' : "N",
                    can_edit: (modify !== undefined)? (modify.V_EDIT !== undefined)? modify.V_EDIT: 'N' : "N",
                    can_delete: (modify !== undefined)? (modify.V_DELETE !== undefined)? modify.V_DELETE: 'N' : "N",
                }                
            })          
        })
    } catch (err) {
        res.sendStatus(500)
    }
}

