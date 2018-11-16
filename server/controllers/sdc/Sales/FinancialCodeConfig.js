import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceGetFinancialCode, ServiceFinancialCodeCheckDuplicate, ServiceInsertFinancialCode, ServiceGetFinancialCodeById, ServiceEditFinancialCode } from '../../../models/Services/Financial';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionAdd, ActionEdit } from '../../../models/action_type';
import { StatusSuccess, StatusComplate, StatusError, StatusUnComplate } from '../../../models/status_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, MSGAddDuplicate, CodeE0001, MSGEditSuccess, MSGEditUnSuccess, CodeS0002 } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings';

export {
    GetFinancialCode,
    AddFinancialCode,
    EditFinancialCode
}

async function GetFinancialCode(req, res, reqBody) {
    try {
        let result = await ServiceGetFinancialCode()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function AddFinancialCode(req, res, reqBody, authData) {
    if (reqBody.fin_code == null) throw new Error("Input not valid")
    if (reqBody.fin_name == null) throw new Error("Input not valid")
    if (reqBody.active == null) throw new Error("Input not valid")
    if (reqBody.show == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let fin_code = reqBody.fin_code.trim()
    let fin_name = reqBody.fin_name.trim()
    let active = reqBody.active.trim()
    let show = reqBody.active.trim()
    let screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''

    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',', '');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await ServiceGetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        //Set Check
        const prmcheck = {
            fin_code: fin_code
        }
        const dupdata = await ServiceFinancialCodeCheckDuplicate(prmcheck)

        //Set object prm
        const prm = {
            fin_code: fin_code,
            fin_name: fin_name,
            active: active,
            show: show,
            create_date: datetime,
            create_by: authData.id
        }

        if (dupdata) {
            const resFin = await ServiceInsertFinancialCode(prm)
            if (resFin !== undefined) { //Insert StatusSuccess
                const prmLog = {
                    audit_trail_date: datetime,
                    module: module_name,
                    screen_name: screen_name,
                    action_type: ActionAdd,
                    status: StatusSuccess,
                    user_id: authData.id,
                    client_ip: req.ip,
                    msg: MSGAddSuccess,
                    browser: browser
                }
                // ActionAdd Log.
                let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
                if (AuditTrail.uid) {
                    //ActionAdd Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: ActionAdd,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusSuccess,
                        audit_msg: MSGAddSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prm,
                        original_value: '',
                    }
                    await ServiceInsertLogAudit(prmLogAudit)
                }

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
            } else { //Insert UnStatusSuccess
                const prmLog = {
                    audit_trail_date: datetime,
                    module: module_name,
                    screen_name: screen_name,
                    action_type: ActionAdd,
                    status: StatusError,
                    user_id: authData.id,
                    client_ip: req.ip,
                    msg: MSGAddUnSuccess,
                    browser: browser
                }
                // ActionAdd Log.
                let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
                if (AuditTrail.uid) {
                    //ActionAdd Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: ActionAdd,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusError,
                        audit_msg: MSGAddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prm,
                        original_value: '',
                    }
                    await ServiceInsertLogAudit(prmLogAudit)
                }

                ////////////////////// Alert Message JSON ////////////////////// 

                const data = {
                    "status": StatusUnComplate,
                    "message": "ไม่สามารถบันทึกข้อมูลลงในระบบได้",
                }
                await res.setHeader('Content-Type', 'application/json');
                await res.send(JSON.stringify(data));
            }
        } else { //Duplicate Data
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: ActionAdd,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGAddUnSuccess,
                browser: browser
            }
            // ActionAdd Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
            if (AuditTrail.uid) {
                //ActionAdd Log Audit 
                const prmLogAudit1 = {
                    audit_date: datetime,
                    action_type: ActionAdd,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGAddDuplicate,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prm,
                    original_value: '',
                }
                await ServiceInsertLogAudit(prmLogAudit1)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                fin_code: fin_code,
            }
            //Get Message Alert.
            const messageAlert = await ServiceGetMessageByCode(CodeE0001, prmMsg)
            const data = {
                "status": StatusUnComplate,
                "message": messageAlert,
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function EditFinancialCode(req, res, obj, authData) {
    if (obj == null) throw new Error("Input not valid")

    let screen_id = obj[0].screen_id
    let screen_name = ''
    let module_name = ''

    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',', '');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await ServiceGetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }


        const prmLog = {
            audit_trail_date: datetime,
            module: module_name,
            screen_name: screen_name,
            action_type: ActionEdit,
            status: StatusSuccess,
            user_id: authData.id,
            client_ip: req.ip,
            msg: MSGEditSuccess,
            browser: browser
        }
        // ActionAdd Log.
        let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

        let rescheck = true
        let itemStatusSuccess = []
        let itemerror = []

        for (let item of obj) {
            const tempdata = await ServiceGetFinancialCodeById(item.fin_code)
            const prmfin = {
                fin_code: item.fin_code,
                fin_desc: item.fin_desc,
                fin_flag: item.fin_flag,
                fin_show: item.fin_show,
                update_date: datetime,
                update_by: authData.id
            }
            const res = await ServiceEditFinancialCode(prmfin)
            if (res != undefined) {
                const prmitem = {
                    fin_code: item.fin_code,
                    fin_desc: item.fin_desc,
                    fin_flag: item.fin_flag,
                    fin_show: item.fin_show,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemStatusSuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    fin_code: item.fin_code,
                    fin_desc: item.fin_desc,
                    fin_flag: item.fin_flag,
                    fin_show: item.fin_show,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemerror.push(prmitem)
                rescheck = false
            }
        }

        //ActionAdd Log Audit StatusSuccess     
        for (let item of itemStatusSuccess) {
            const new_value = {
                fin_code: item.fin_code,
                fin_desc: item.fin_desc,
                fin_flag: item.fin_flag,
                fin_show: item.fin_show,
                update_date: item.update_date,
                update_by: item.update_by,
            }
            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusSuccess,
                    audit_msg: MSGEditSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }


        //ActionAdd Log Audit Error
        for (let item of itemerror) {
            const new_value = {
                fin_code: item.fin_code,
                fin_desc: item.fin_desc,
                fin_flag: item.fin_flag,
                fin_show: item.fin_show,
                update_date: item.update_date,
                update_by: item.update_by,
            }

            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGEditUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }


        //Respone StatusSuccess
        if (rescheck == true) {
            //Get Message Alert.
            let messageAlert = await ServiceGetMessageByCode(CodeS0002)

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
        } else { //Respone Error
            const data = {
                "status": StatusUnComplate,
                "message": `Financial Code ${itemerror.map((item) => { return item['fin_code'] })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

