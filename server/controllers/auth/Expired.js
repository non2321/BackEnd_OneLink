import jwtDecode from 'jwt-decode';
import browserdetect from 'browser-detect';

import { ServiceInsertLogAuditTrail } from '../../models/Services/Log';
import { ServiceResponseMsg } from '../../models/Services/Messsage';

import { ActionExpired } from '../../models/action_type';
import { StatusError } from '../../models/status_type';
import { ModuleOneLink } from '../../models/module_type';
import { MSGAuthTokenExpired } from '../../models/msg_type';

export { Expired };

async function Expired(req, res, data) {
    try {
        const decoded = (req.token != null) ? jwtDecode(req.token) : null;
        const authData = (decoded != null) ? decoded.jwtdata : null;

        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',', '');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //token null equals First Login.
        if (decoded != null) {
            const prmLog = {
                audit_trail_date: datetime,
                module: ModuleOneLink,
                screen_name: ModuleOneLink,
                action_type: ActionExpired,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: `${MSGAuthTokenExpired}`,
                browser: browser,
            }

            //Add Log.            
            await ServiceInsertLogAuditTrail(prmLog)
        }
        //Response
        await ServiceResponseMsg(res, data);

    } catch (err) {
        res.sendStatus(400)
    }
}

