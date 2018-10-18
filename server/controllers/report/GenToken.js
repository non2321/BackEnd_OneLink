const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect')

//fetch
const fetch = require('node-fetch')
const FormData = require('form-data')

const menu = require('../../models/Services/Menu')

const log = require('../../models/Services/Log')
const Financial = require('../../models/Services/Financial')
const message = require('../../models/Services/Messsage')

const action_type = require('../../models/action_type')
const status_type = require('../../models/status_type')
const msg_type = require('../../models/msg_type')

const settings = require('../../../settings')

module.exports.GenTokenTableau = GenTokenTableau
module.exports.GenTokenTableauForFullScreen = GenTokenTableauForFullScreen

async function GenTokenTableau(req, res, reqBody, authData) {
    const screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''
    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','')
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']))

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        // const form = new FormData();
        // form.append('username', settings.tableautoken.username)       
        // const response = await fetch(settings.tableautoken.path, { method: 'POST', body: form })
        // const tableautoken = await response.text()
           
       
        //Mock api gen token tableau 192.168.151.113:3000
        const response = await fetch('http://192.168.151.113:3000/api/test', { method: 'GET'})
        const tableautoken = await response.text()
       
        if (tableautoken.length > 5) {           
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.Select,
                status: status_type.Success,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.SelectSuccess,
                browser: browser
            }
            // Add Log.
            let AuditTrail = await log.InsertLogAuditTrail(prmLog)

            //Get Message Alert.
            let messageAlert = await message.GetMessageByCode(msg_type.CodeS0001)

            //Send JWT
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
                    "message": messageAlert,
                    "data": tableautoken,
                    "user": {
                        "id": authData.id,
                        "firstname": authData.firstname,
                        "lastname": authData.lastname,
                        "position": authData.position,
                        "email": authData.email,
                        "mobile_no": authData.mobile_no,
                        "phc_user": authData.phc_user,
                        token
                    }
                })
            })
        } else {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.Select,
                status: status_type.Error,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.SelectUnSuccess,
                browser: browser
            }
            // Add Log.
            let AuditTrail = await log.InsertLogAuditTrail(prmLog)

            //Get Message Alert.
            let messageAlert = `Can not generate token from server.`
            const data = {
                "status": status_type.Error,
                "message": messageAlert,
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GenTokenTableauForFullScreen(req, res, reqBody, authData) {
    const screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''
    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','')
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']))

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        // const form = new FormData();
        // form.append('username', settings.tableautoken.username)       
        // const response = await fetch(settings.tableautoken.path, { method: 'POST', body: form })
        // const tableautoken = await response.text()
           
       
        //Mock api gen token tableau 192.168.151.113:3000
        const response = await fetch('http://192.168.151.113:3000/api/test', { method: 'GET'})
        const tableautoken = await response.text()
       
        if (tableautoken.length > 5) {
            //Get Message Alert.
            let messageAlert = await message.GetMessageByCode(msg_type.CodeS0001)

            //Send JWT
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
                    "message": messageAlert,
                    "data": tableautoken,
                    "user": {
                        "id": authData.id,
                        "firstname": authData.firstname,
                        "lastname": authData.lastname,
                        "position": authData.position,
                        "email": authData.email,
                        "mobile_no": authData.mobile_no,
                        "phc_user": authData.phc_user,
                        token
                    }
                })
            })
        } else {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.Select,
                status: status_type.Error,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.SelectUnSuccess,
                browser: browser
            }            

            //Get Message Alert.
            let messageAlert = `Can not generate token from server.`
            const data = {
                "status": status_type.Error,
                "message": messageAlert,
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}