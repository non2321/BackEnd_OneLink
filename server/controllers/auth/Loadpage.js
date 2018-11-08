import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';

import { secretkey, tokenexpires } from '../../../settings';

import { ServiceInsertLogAuditTrail } from '../../models/Services/Log';
import { ServiceGetScreenById, ServiceGetModifyData } from '../../models/Services/Menu';

import { MSGLoadPage, MSGAuthSuccess } from '../../models/msg_type';
import { ActionLoadPage } from '../../models/action_type';
import { StatusSuccess, StatusComplate } from '../../models/status_type';


export { LoadPage };

async function LoadPage(req, res, reqBody, authData) {
    try {        
        if (reqBody.screen_id == null) throw new Error("Input not valid")

        const screen_id = reqBody.screen_id
        let screen_name = ''
        let module_name = ''

        //Get Screen name && module
        const screen = await ServiceGetScreenById(screen_id)
        if (Object.keys(screen).length > 0) {         
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }
        // Data Modify
        const prm = { user_id: authData.id, screen_id: screen_id }
        const modify = await ServiceGetModifyData(prm)

        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        const prmLog = {
            audit_trail_date: datetime,
            module: module_name,
            screen_name: screen_name,
            action_type: ActionLoadPage,
            status: StatusSuccess,
            user_id: authData.id,
            client_ip: req.ip,
            msg: `${MSGLoadPage} ${screen_name}`,
            browser: browser,
        }

        //Add Log.
        await ServiceInsertLogAuditTrail(prmLog)

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
                "message": MSGAuthSuccess,
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

