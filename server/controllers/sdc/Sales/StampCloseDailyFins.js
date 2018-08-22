const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect');
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const Financial = require('../../../models/Services/Financial')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')

const settings = require('../../../../settings')


module.exports.StampCloseDaiyFins = StampCloseDaiyFins

async function StampCloseDaiyFins(req, res, reqBody, authData) {
    if (reqBody.stamp == null) throw new Error("Input not valid")
    if (reqBody.datefrom == null) throw new Error("Input not valid")
    if (reqBody.dateto == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let stamp = reqBody.stamp.trim()
    let datefrom = reqBody.datefrom.trim()
    let dateto = reqBody.dateto.trim()
    let screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''

    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }
        const prmcount = {
            datefrom: datefrom,
            dateto: dateto
        }

        if (stamp == 'option1') {
            const StampCount = await Financial.CountStampCloseDaiyFins(prmcount)

            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.Add,
                status: status_type.Success,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.AddSuccess,
                browser: browser
            }
            // Add Log.                   

            let AuditTrail = await log.InsertLogAuditTrail(prmLog)

            if (StampCount.rowsAffected > 0) {

                if (AuditTrail.uid) {
                    //Add Log Audit
                    const tempdata = {
                        tabel_name: 'DAILY_FINS',
                        owner: authData.id,
                        start_date: datefrom,
                        end_date: dateto,
                        create_date: datetime,
                        create_by: authData.id,
                        status: 'A'
                    }
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Add,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Error,
                        audit_msg: msg_type.AddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: tempdata,
                        original_value: '',
                    }
                    await log.InsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                const messageAlert = await message.GetMessageByCode(msg_type.CodeE0002)
                const data = {
                    "status": status_type.UnComplate,
                    "message": messageAlert,
                }
                await res.setHeader('Content-Type', 'application/json');
                await res.send(JSON.stringify(data));

            } else {
                const prm = {
                    owner: authData.id,
                    datefrom: datefrom,
                    dateto: dateto,
                    create_date: datetime,
                    create_by: authData.id
                }

                const result = await Financial.AddStampCloseDaiyFins(prm)
                if (result !== undefined) { //Insert Success  

                    if (AuditTrail.uid) {
                        //Add Log Audit
                        const tempdata = {
                            tabel_name: 'DAILY_FINS',
                            owner: authData.id,
                            start_date: datefrom,
                            end_date: dateto,
                            create_date: datetime,
                            create_by: authData.id,
                            status: 'A'
                        }
                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: action_type.Add,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: status_type.Success,
                            audit_msg: msg_type.AddSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
                            original_value: '',
                        }
                        await log.InsertLogAudit(prmLogAudit)
                    }

                    //Get Message Alert.
                    let messageAlert = await message.GetMessageByCode(msg_type.CodeS0004)

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
                            "id": authData.id,
                            "firstname": authData.firstname,
                            "lastname": authData.lastname,
                            "position": authData.position,
                            "email": authData.email,
                            "mobile_no": authData.mobile_no,
                            "phc_user": authData.phc_user,
                            token
                        })
                    })
                } else {
                    const prmLog = {
                        audit_trail_date: datetime,
                        module: module_name,
                        screen_name: screen_name,
                        action_type: action_type.Add,
                        status: status_type.Error,
                        user_id: authData.id,
                        client_ip: req.ip,
                        msg: msg_type.AddUnSuccess,
                        browser: browser
                    }
                    // Add Log.
                    let AuditTrail = await log.InsertLogAuditTrail(prmLog)
                    if (AuditTrail.uid) {
                        //Add Log Audit   
                        const tempdata = {
                            tabel_name: 'DAILY_FINS',
                            owner: authData.id,
                            start_date: datefrom,
                            end_date: dateto,
                            create_date: datetime,
                            create_by: authData.id,
                            status: 'A'
                        }

                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: action_type.Add,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: status_type.Error,
                            audit_msg: msg_type.AddUnSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
                            original_value: '',
                        }
                        await log.InsertLogAudit(prmLogAudit)
                    }

                    ////////////////////// Alert Message JSON ////////////////////// 

                    const data = {
                        "status": status_type.UnComplate,
                        "message": "ไม่สามารถบันทึกข้อมูลลงในระบบได้",
                    }
                    await res.setHeader('Content-Type', 'application/json');
                    await res.send(JSON.stringify(data));
                }
            }
        } else if (stamp == 'option2') {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.Edit,
                status: status_type.Success,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.EditSuccess,
                browser: browser
            }
            // Add Log.
            let AuditTrail = await log.InsertLogAuditTrail(prmLog)

            const prm = {
                owner: authData.id,
                datefrom: datefrom,
                dateto: dateto,
                update_date: datetime,
                update_by: authData.id
            }
            let temp = await Financial.SearchTempStampCloseDaiyFins(prm)

            const StampCount = await Financial.CountStampCloseDaiyFins(prmcount)
            if (StampCount.rowsAffected > 0) {
                
                const result = await Financial.EditStampCloseDaiyFins(prm)
                if (result !== undefined) { //Edit Success                                       
                    if (AuditTrail.uid) {
                        //Add Log Audit  
                        const tempdata = {
                            tabel_name: 'DAILY_FINS',
                            start_date: datefrom,
                            end_date: dateto,
                            update_date: datetime,
                            update_by: authData.id,
                            status: 'I'
                        }

                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: action_type.Edit,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: status_type.Success,
                            audit_msg: msg_type.EditSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
                            original_value: temp.recordset,
                        }
                        await log.InsertLogAudit(prmLogAudit)
                    }

                    //Get Message Alert.
                    let messageAlert = await message.GetMessageByCode(msg_type.CodeS0005)

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
                            "id": authData.id,
                            "firstname": authData.firstname,
                            "lastname": authData.lastname,
                            "position": authData.position,
                            "email": authData.email,
                            "mobile_no": authData.mobile_no,
                            "phc_user": authData.phc_user,
                            token
                        })
                    })
                } else {
                    const prmLog = {
                        audit_trail_date: datetime,
                        module: module_name,
                        screen_name: screen_name,
                        action_type: action_type.Edit,
                        status: status_type.Error,
                        user_id: authData.id,
                        client_ip: req.ip,
                        msg: msg_type.EditUnSuccess,
                        browser: browser
                    }
                    // Add Log.
                    let AuditTrail = await log.InsertLogAuditTrail(prmLog)
                    if (AuditTrail.uid) {
                        //Add Log Audit   
                        const tempdata = {
                            tabel_name: 'DAILY_FINS',
                            start_date: datefrom,
                            end_date: dateto,
                            update_date: datetime,
                            update_by: authData.id,
                            status: 'I'
                        }

                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: action_type.Edit,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: status_type.Error,
                            audit_msg: msg_type.EditUnSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
                            original_value: temp.recordset,
                        }
                        await log.InsertLogAudit(prmLogAudit)
                    }

                    ////////////////////// Alert Message JSON ////////////////////// 

                    const data = {
                        "status": status_type.UnComplate,
                        "message": "ไม่สามารถบันทึกข้อมูลลงในระบบได้",
                    }
                    await res.setHeader('Content-Type', 'application/json');
                    await res.send(JSON.stringify(data));
                }
            } else {               
                if (AuditTrail.uid) {
                    //Add Log Audit  
                    const tempdata = {
                        tabel_name: 'DAILY_FINS',
                        start_date: datefrom,
                        end_date: dateto,
                        update_date: datetime,
                        update_by: authData.id,
                        status: 'I'
                    }
                   
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Edit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Error,
                        audit_msg: msg_type.EditUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: tempdata,
                        original_value: temp.recordset,
                    }
                    await log.InsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                const messageAlert = await message.GetMessageByCode(msg_type.CodeE0003)
                const data = {
                    "status": status_type.UnComplate,
                    "message": messageAlert,
                }
                await res.setHeader('Content-Type', 'application/json');
                await res.send(JSON.stringify(data));
            }
        }

    } catch (err) {
        res.sendStatus(500)
    }
}