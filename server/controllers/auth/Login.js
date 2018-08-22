const ActiveDirectory = require('activedirectory')
const sql = require('mssql') // MS Sql Server client


const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect');

const settings = require('../../../settings')
const users = require('../../models/Services/Users')
const log = require('../../models/Services/Log')
const message = require('../../models/Services/Messsage')
const menu = require('../../models/Services/Menu')

const action_type = require('../../models/action_type')
const status_type = require('../../models/status_type')
const msg_type = require('../../models/msg_type')

module.exports.Login = Login; 

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


        const screen = await menu.GetScreenById(screen_id)
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
        username = username.replace("@" + settings.domain + ".com", "").replace(settings.domain + ".com\\", "").replace(settings.domain + "\\", "")
        //Set sAMAccountName       
        sAMAccountName = username;
        //Full name user AD
        username = username + "@" + settings.domain + ".com"
        const ad = new ActiveDirectory(settings.adConfig)
        await ad.authenticate(username, password, async (err, auth) => {
            if (err) {                
                const data = {
                    "status": status_type.UnComplate,
                    "message": "User หรือ Password ไม่ถูกต้อง",
                }
                await res.setHeader('Content-Type', 'application/json');
                await res.send(JSON.stringify(data));
            }
            if (auth) {
                //Get Data User                
                let result = await users.GetUsersByUsername(username)               

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
                            action_type: action_type.Login,
                            status: status_type.Success,
                            user_id: user.id,
                            client_ip: req.ip,
                            msg: msg_type.LoginSuccess,
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
                        await log.InsertLogAuditTrail(prmLog)

                        //Send JSON Web Token.
                        await jwt.sign({ jwtdata }, settings.secretkey, { expiresIn: settings.tokenexpires }, (err, token) => {
                            res.json({
                                "status": status_type.Complate,
                                "message": msg_type.LoginSuccess,
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
                            action_type: action_type.Login,
                            status: status_type.Error,
                            user_id: user.id,
                            client_ip: req.ip,
                            msg: msg_type.LoginUnSuccess,
                            browser: browser
                        }
                        //Add Log.
                        await log.InsertLogAuditTrail(prmLog)

                        const prmMsg = {
                            name: result.recordset[0].FIRST_NAME,
                            lastname: result.recordset[0].LAST_NAME
                        }
                        const messageError = await message.GetMessageByCode(msg_type.CodeE0009, prmMsg)
                        const data = {
                            "status": status_type.UnComplate,
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
                                "status": status_type.UnComplate,
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
                                action_type: action_type.Login,
                                status: status_type.Error,
                                user_id: (user.id == null) ? user.mail : user.id,
                                client_ip: req.ip,
                                msg: msg_type.LoginUnSuccess,
                                browser: browser
                            }

                            // Add user.                            
                            await users.InsertUsers(prmUser);
                            // Add Log.
                            await log.InsertLogAuditTrail(prmLog)

                            const prmMsg = {
                                name: user.givenName,
                                lastname: user.sn
                            }
                            const messageError = await message.GetMessageByCode(msg_type.CodeE0009, prmMsg)
                            const data = {
                                "status": status_type.UnComplate,
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

