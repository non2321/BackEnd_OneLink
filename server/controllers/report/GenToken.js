import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';

//fetch
import fetch from 'node-fetch';

import { ServiceGetScreenById } from '../../models/Services/Menu';

import { ServiceInsertLogAuditTrail } from '../../models/Services/Log';
import { ServiceGetMessageByCode } from '../../models/Services/Messsage';

import { Select } from '../../models/action_type';
import { StatusSuccess, StatusComplate, StatusError } from '../../models/status_type';
import { MSGSelectSuccess, CodeS0001, MSGSelectUnSuccess } from '../../models/msg_type';

import { secretkey, tokenexpires, tableautoken as  tableautokens} from '../../../settings';


export {
    GenTokenTableau,
    GenTokenTableauForFullScreen
};


async function GenTokenTableau(req, res, reqBody, authData) {
    const screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''
    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',', '')
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']))

        //Get Screen name && Module name
        const screen = await ServiceGetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        // const form = new FormData();
        // form.append('username', settings.tableautoken.username)       
        // const response = await fetch(settings.tableautoken.path, { method: 'POST', body: form })
        // const tableautoken = await response.text()


        //Mock api gen token tableau 192.168.151.113:3000
        const response = await fetch('http://192.168.151.113:3000/api/test', { method: 'GET' })
        const tableautoken = await response.text()

        if (tableautoken.length > 5) {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: Select,
                status: StatusSuccess,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGSelectSuccess,
                browser: browser
            }
            // Add Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

            //Get Message Alert.
            let messageAlert = await ServiceGetMessageByCode(CodeS0001)

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

            await sign({ jwtdata }, secretkey, { expiresIn: tokenexpires }, (err, token) => {
                res.json({
                    "status": StatusComplate,
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
                action_type: Select,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGSelectUnSuccess,
                browser: browser
            }
            // Add Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

            //Get Message Alert.
            let messageAlert = `Can not generate token from server.`
            const data = {
                "status": StatusError,
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
        const datetime = new Date().toLocaleString().replace(',', '')
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']))

        //Get Screen name && Module name
        const screen = await ServiceGetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        // const form = new FormData();
        // form.append('username', settings.tableautoken.username)       
        // const response = await fetch(settings.tableautoken.path, { method: 'POST', body: form })
        // const tableautoken = await response.text()


        //Mock api gen token tableau
        const response = await fetch(tableautokens.servergentoken, { method: 'GET' })
        const tableautoken = await response.text()

        if (tableautoken.length > 5) {
            //Get Message Alert.
            let messageAlert = await ServiceGetMessageByCode(CodeS0001)

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

            await sign({ jwtdata }, secretkey, { expiresIn: tokenexpires }, (err, token) => {
                res.json({
                    "status": StatusComplate,
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
                action_type: Select,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGSelectUnSuccess,
                browser: browser
            }

            //Get Message Alert.
            let messageAlert = `Can not generate token from server.`
            const data = {
                "status": StatusError,
                "message": messageAlert,
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}