import ActiveDirectory from 'activedirectory';

import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';

import { domain, adConfig, secretkey, tokenexpires } from '../../../settings';
import { ServiceGetUsersByUsername, ServiceInsertUsers } from '../../models/Services/Users';
import { ServiceInsertLogAuditTrail } from '../../models/Services/Log';
import { ServiceGetMessageByCode } from '../../models/Services/Messsage';
import { ServiceGetScreenById } from '../../models/Services/Menu';

import { ActionLogin } from '../../models/action_type';
import { StatusUnComplate, StatusSuccess, StatusComplate, StatusError } from '../../models/status_type';
import { MSGLoginSuccess, MSGLoginUnSuccess, CodeE0009 } from '../../models/msg_type';


export { Login }; 

async function Login(req, res, reqBody) {
    try {
        if (reqBody.username == null) throw new Error("Input not valid")
        if (reqBody.password == null) throw new Error("Input not valid")
        if (reqBody.screen_id == null) throw new Error("Input not valid")

        let username = reqBody.username
        let password = reqBody.password
        let screen_id = reqBody.screen_id
        let screen_name = ''
        let module_name = ''


        const screen = await ServiceGetScreenById(screen_id)
        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        let sAMAccountName = '';

        // on localhost you'll see 127.0.0.1 if you're using IPv4  
        // or ::1, ::ffff:127.0.0.1 if you're using IPv6 
        const ip = req.clientIp

        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));
        //Replace Format AD User
        username = username.replace("@" + domain + ".com", "").replace(domain + ".com\\", "").replace(domain + "\\", "")
        //Set sAMAccountName       
        sAMAccountName = username;
        //Full name user AD
        username = username + "@" + domain + ".com"
        const ad = new ActiveDirectory(adConfig)
        await ad.authenticate(username, password, async (err, auth) => {
            if (err) {                
                const data = {
                    "status": StatusUnComplate,
                    "message": "User หรือ Password ไม่ถูกต้อง",
                }
                await res.setHeader('Content-Type', 'application/json');
                await res.send(JSON.stringify(data));
            }
            if (auth) {
                //Get Data User                
                let result = await ServiceGetUsersByUsername(username)               

                if (result.rowsAffected > 0) {
                    const user = {
                        id: result.recordset[0].USER_ID,
                        firstname: result.recordset[0].FIRST_NAME,
                        lastname: result.recordset[0].LAST_NAME,
                        position: result.recordset[0].POSITION,
                        email: result.recordset[0].EMAIL,
                        mobile_no: result.recordset[0].MOBILE_NO,
                        record_status: result.recordset[0].RECORD_STATUS,
                        create_date: result.recordset[0].CREATE_DATE,
                        create_by: result.recordset[0].CREATE_BY,
                        phc_user: result.recordset[0].PHC_USER,
                        client_ip: req.ip
                    }

                    //check status
                    if (user.record_status == 'Y') {
                        const prmLog = {
                            audit_trail_date: datetime,
                            module: module_name,
                            screen_name: screen_name,
                            action_type: ActionLogin,
                            status: StatusSuccess,
                            user_id: user.id,
                            client_ip: req.ip,
                            msg: MSGLoginSuccess,
                            browser: browser
                        }
                        const jwtdata = {
                            id: user.id,
                            firstname: user.firstname,
                            lastname: user.lastname,
                            position: user.position,
                            email: user.email,
                            mobile_no: user.mobile_no,
                            phc_user: user.phc_user,
                        }


                        // Add Log.
                        await ServiceInsertLogAuditTrail(prmLog)

                        //Send JSON Web Token.
                        await sign({ jwtdata }, secretkey, { expiresIn: tokenexpires }, (err, token) => {
                            res.json({
                                "status": StatusComplate,
                                "message": MSGLoginSuccess,
                                "id": user.id,
                                "firstname": user.firstname,
                                "lastname": user.lastname,
                                "position": user.position,
                                "email": user.email,
                                "mobile_no": user.mobile_no,
                                "phc_user": user.phc_user,
                                token
                            })

                        })
                    }
                    if (user.record_status == 'N') {
                        //LoginUnSuccess
                        const prmLog = {
                            audit_trail_date: datetime,
                            module: module_name,
                            screen_name: screen_name,
                            action_type: ActionLogin,
                            status: StatusError,
                            user_id: user.id,
                            client_ip: req.ip,
                            msg: MSGLoginUnSuccess,
                            browser: browser
                        }
                        //Add Log.
                        await ServiceInsertLogAuditTrail(prmLog)

                        const prmMsg = {
                            name: result.recordset[0].FIRST_NAME,
                            lastname: result.recordset[0].LAST_NAME
                        }
                        const messageError = await ServiceGetMessageByCode(CodeE0009, prmMsg)
                        const data = {
                            "status": StatusUnComplate,
                            "message": messageError,
                        }
                        await res.setHeader('Content-Type', 'application/json');
                        await res.send(JSON.stringify(data));
                    }

                } else {//User not found                                       
                    // Find user by a sAMAccountName                              
                    await ad.findUser(sAMAccountName, async function (err, user) {
                        if (err) { // error
                            const data = {
                                "status": StatusUnComplate,
                                "message": "User หรือ Password ไม่ถูกต้อง",
                            }
                            await res.setHeader('Content-Type', 'application/json');
                            await res.send(JSON.stringify(data));
                        };
                        if (!user) res.sendStatus(403); // user not found.
                        else {
                            //LoginUnSuccess
                            const prmUser = {
                                first_name: user.givenName,
                                last_name: user.sn,
                                position: '',
                                email: user.mail,
                                mobile_no: '',
                                record_status: 'N',
                                create_date: datetime,
                                create_by: 'SYSTEM',
                                phc_user: username
                            }

                            //LoginUnSuccess
                            const prmLog = {
                                audit_trail_date: datetime,
                                module: module_name,
                                screen_name: screen_name,
                                action_type: ActionLogin,
                                status: StatusError,
                                user_id: (user.id == null) ? user.mail : user.id,
                                client_ip: req.ip,
                                msg: MSGLoginUnSuccess,
                                browser: browser
                            }

                            // Add user.                            
                            await ServiceInsertUsers(prmUser);
                            // Add Log.
                            await ServiceInsertLogAuditTrail(prmLog)

                            const prmMsg = {
                                name: user.givenName,
                                lastname: user.sn
                            }
                            const messageError = await ServiceGetMessageByCode(CodeE0009, prmMsg)
                            const data = {
                                "status": StatusUnComplate,
                                "message": messageError,
                            }
                            await res.setHeader('Content-Type', 'application/json');
                            await res.send(JSON.stringify(data));
                        }
                    });
                }
            }
        })

    } catch (err) {       
        res.sendStatus(500)
    }
}

