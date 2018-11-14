import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceGetAccountCodeForSale, ServiceCheckDuplicateAccountCodeForSale, ServiceInsertAccountCodeForSale, ServiceGetAccountCodeForSaleById, ServiceCheckEditDuplicateAccountCodeForSale, ServiceEditAccountCodeForSale, ServiceGetDropDownBuType, ServiceGetDropDownType } from '../../../models/Services/Financial';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionAdd, ActionEdit } from '../../../models/action_type';
import { StatusSuccess, StatusComplate, StatusError, StatusUnComplate } from '../../../models/status_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, MSGAddDuplicate, CodeE0001, MSGEditSuccess, CodeS0002, MSGEditUnSuccess, MSGEditDuplicate } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings';

export {
    GetAccountCode,
    AddAccountCode,
    EditAccountCode,
    GetDropDownBuType,
    GetDropDownType
}

async function GetAccountCode(req, res, reqBody) {
    try {
        let result = await ServiceGetAccountCodeForSale()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function AddAccountCode(req, res, reqBody, authData) {
    if (reqBody.formular_name == null) throw new Error("Input not valid")
    // if (reqBody.account_code == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let formular_name = reqBody.formular_name.trim()
    let account_code = (reqBody.account_code.trim() == '') ? 'No Use' : reqBody.account_code.trim()
    let bu_type = reqBody.bu_type.trim()
    let type = reqBody.type.trim()
    let subledger_type = reqBody.subledger_type.trim()
    let subledger = reqBody.subledger.trim()
    let fincode = reqBody.fincode.trim()
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

        let dupdata = await ServiceCheckDuplicateAccountCodeForSale(formular_name)

        //Set object prm
        const prm = {}
        prm['formular_name'] = formular_name
        prm['account_code'] = account_code
        prm['bu_type'] = bu_type
        prm['type'] = type
        prm['subledger_type'] = subledger_type
        prm['subledger'] = subledger
        prm['fincode'] = fincode
        if (datetime) prm['create_date'] = datetime
        if (authData.id) prm['create_by'] = authData.id

        if (dupdata) {

            let result = await ServiceInsertAccountCodeForSale(prm)

            if (result !== undefined) { //Insert StatusSuccess            
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
                // Add Log.
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
            } else {  //Insert UnStatusSuccess
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
                formular_name: formular_name,
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

async function EditAccountCode(req, res, reqBody, authData) {
    if (reqBody.formular_id == null) throw new Error("Input not valid")
    // if (reqBody.formular_name == null) throw new Error("Input not valid")
    if (reqBody.account_code == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let formular_id = reqBody.formular_id.trim()
    let formular_name = reqBody.formular_name.trim()
    let account_code = (reqBody.account_code.trim() == '') ? 'No Use' : reqBody.account_code.trim()
    let bu_type = reqBody.bu_type.trim()
    let type = reqBody.type.trim()
    let subledger_type = reqBody.subledger_type.trim()
    let subledger = reqBody.subledger.trim()
    let fincode = reqBody.fincode.trim()
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
        let tempdata = await ServiceGetAccountCodeForSaleById(formular_id)

        //Set prmcheck
        const prmcheck = {}
        prmcheck['formular_id'] = formular_id
        prmcheck['formular_name'] = formular_name
        let dupdata = await ServiceCheckEditDuplicateAccountCodeForSale(prmcheck)

        //Set object prm
        const prm = {}
        prm['formular_id'] = formular_id
        prm['formular_name'] = formular_name
        prm['account_code'] = account_code
        prm['bu_type'] = bu_type
        prm['type'] = type
        prm['subledger_type'] = subledger_type
        prm['subledger'] = subledger
        prm['fincode'] = fincode
        if (datetime) prm['update_date'] = datetime
        if (authData.id) prm['update_by'] = authData.id

        if (dupdata) {
            let result = await ServiceEditAccountCodeForSale(prm)

            if (result !== undefined) { //Edit StatusSuccess            
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
                if (AuditTrail.uid) {
                    //ActionAdd Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: ActionEdit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusSuccess,
                        audit_msg: MSGEditSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prm,
                        original_value: tempdata.recordset,
                    }
                    await ServiceInsertLogAudit(prmLogAudit)
                }

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
            } else {  //Edit UnSuccess
                const prmLog = {
                    audit_trail_date: datetime,
                    module: module_name,
                    screen_name: screen_name,
                    action_type: ActionEdit,
                    status: StatusError,
                    user_id: authData.id,
                    client_ip: req.ip,
                    msg: MSGEditUnSuccess,
                    browser: browser
                }
                // Add Log.
                let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
                if (AuditTrail.uid) {
                    //Add Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: ActionEdit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusError,
                        audit_msg: MSGEditUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prm,
                        original_value: tempdata.recordset,
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
        } else { //Dupicate Date
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: ActionEdit,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGEditUnSuccess,
                browser: browser
            }
            // ActionAdd Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
            if (AuditTrail.uid) {
                //ActionAdd Log Audit 
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGEditDuplicate,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prm,
                    original_value: tempdata.recordset,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                formular_name: formular_name,
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

async function GetDropDownBuType(req, res, reqBody) {
    try {
        let result = await ServiceGetDropDownBuType()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['LOV1'], label: items[item]['LOV1'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetDropDownType(req, res, reqBody) {
    try {
        let result = await ServiceGetDropDownType()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['LOV1'], label: items[item]['LOV1'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}