import browserdetect from 'browser-detect';

import { ServiceInsertLogAuditTrail } from '../../models/Services/Log';

import { ActionLogout } from '../../models/action_type';
import { StatusSuccess, StatusComplate } from '../../models/status_type';
import { ModuleOneLink } from '../../models/module_type';
import { MSGLogoutSuccess } from '../../models/msg_type';

export { Logout };  

async function Logout(req, res, reqBody, authData)  {
    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        const prmLog = {
            audit_trail_date: datetime,
            module: ModuleOneLink,
            screen_name: '',
            action_type: ActionLogout,
            status: StatusSuccess,
            user_id: authData.id,
            client_ip: req.ip,
            msg: `${MSGLogoutSuccess}`,
            browser: browser,
        }

        //Add Log.
        await ServiceInsertLogAuditTrail(prmLog)

        const data = {
            "status": StatusComplate,
            "message": MSGLogoutSuccess,
          }
          await res.setHeader('Content-Type', 'application/json')
          await res.send(JSON.stringify(data))
      
     
    } catch (err) {       
        res.sendStatus(500)
    }
}


