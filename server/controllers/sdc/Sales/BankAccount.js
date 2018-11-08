import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceGetBankAccount, ServiceCheckDuplicateBankAccount, ServiceInsertBankAccount, ServiceGetBankAccountById, ServiceEditBankAccount, ServiceDeleteBankAccountById } from '../../../models/Services/Financial';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionAdd, ActionEdit, ActionDelete } from '../../../models/action_type';
import { StatusSuccess, StatusComplate, StatusError, StatusUnComplate } from '../../../models/status_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, MSGAddDuplicate, CodeE0001, MSGEditSuccess, CodeS0002, MSGEditUnSuccess, MSGDeleteSuccess, CodeS0003, MSGDeleteUnSuccess } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings';

export {
    GetBankAccount,
    AddBankAccount,
    EditBankAccount,
    DeleteBankAccount
}

async function GetBankAccount(req, res, reqBody) {
    try {
        let result = await ServiceGetBankAccount()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function AddBankAccount(req, res, reqBody, authData) {
    if (reqBody.bank_code == null) throw new Error("Input not valid")
    if (reqBody.bank_name == null) throw new Error("Input not valid")
    if (reqBody.bank_branch == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let bank_code = reqBody.bank_code.trim()
    let bank_name = reqBody.bank_name.trim()
    let bank_branch = reqBody.bank_branch.trim()
    let account_code = reqBody.account_code.trim()
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

        let dupdata = await ServiceCheckDuplicateBankAccount(bank_code)

        //Set object prm
        const prm = {}
        prm['bank_code'] = bank_code
        prm['bank_name'] = bank_name
        prm['bank_branch'] = bank_branch
        if (account_code) prm['account_code'] = account_code
        if (datetime) prm['create_date'] = datetime
        if (authData.id) prm['create_by'] = authData.id

        if (dupdata) {

            let reslov = await ServiceInsertBankAccount(prm)

            if (reslov !== undefined) { //Insert StatusSuccess            
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
                bank_code: bank_code,
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

async function EditBankAccount(req, res, reqBody, authData) {
    if (reqBody.bank_code == null) throw new Error("Input not valid")
    if (reqBody.bank_name == null) throw new Error("Input not valid")
    if (reqBody.bank_branch == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let bank_code = reqBody.bank_code.trim()
    let bank_name = reqBody.bank_name.trim()
    let bank_branch = reqBody.bank_branch.trim()
    let account_code = reqBody.account_code.trim()
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

        //Set object prm
        const prm = {}
        prm['bank_code'] = bank_code
        prm['bank_name'] = bank_name
        prm['bank_branch'] = bank_branch
        prm['account_code'] = account_code
        if (datetime) prm['update_date'] = datetime
        if (authData.id) prm['update_by'] = authData.id

        let tempdata = await ServiceGetBankAccountById(bank_code)
        let reslov = await ServiceEditBankAccount(prm)

        if (reslov !== undefined) { //ActionEdit StatusSuccess            
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
        } else {  //ActionEdit UnStatusSuccess
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
                    audit_msg: MSGAddUnSuccess,
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
    } catch (err) {
        res.sendStatus(500)
    }
}

async function DeleteBankAccount(req, res, reqBody, authData) {

    if (reqBody.bank_code == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let bank_code = reqBody.bank_code.trim()
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

        let tempdata = await ServiceGetBankAccountById(bank_code)

        let result = await ServiceDeleteBankAccountById(bank_code)

        if (result !== undefined) { //ActionDelete StatusSuccess 
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: ActionDelete,
                status: StatusSuccess,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGDeleteSuccess,
                browser: browser
            }

            // ActionAdd Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
            if (AuditTrail.uid) {
                //ActionAdd Log Audit         
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionDelete,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusSuccess,
                    audit_msg: MSGDeleteSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: '',
                    original_value: tempdata.recordset,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }

            //Get Message Alert.
            let messageAlert = await ServiceGetMessageByCode(CodeS0003)

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
        } else {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: ActionDelete,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGDeleteUnSuccess,
                browser: browser
            }
            // ActionAdd Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
            if (AuditTrail.uid) {
                //ActionAdd Log Audit         
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionDelete,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGDeleteUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: '',
                    original_value: tempdata.recordset,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////            
            const data = {
                "status": StatusUnComplate,
                "message": "ไม่สามารถลบข้อมูลลงในระบบได้",
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}
