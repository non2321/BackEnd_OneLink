import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceGetCompanyConfig, ServiceCheckDuplicate, ServiceInsertLov, ServiceGetLovById, ServiceCheckEditDuplicate, ServiceEditLov, ServiceDeleteLovById, ServiceGetCompanyAccountConfig } from '../../../models/Services/Lov';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionAdd, ActionEdit, ActionDelete } from '../../../models/action_type';
import { StatusSuccess, StatusComplate, StatusError, StatusUnComplate } from '../../../models/status_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, MSGAddDuplicate, CodeE0001, MSGEditSuccess, CodeS0002, MSGEditUnSuccess, MSGEditDuplicate, MSGDeleteSuccess, CodeS0003, MSGDeleteUnSuccess } from '../../../models/msg_type';
import { Lov_Group_SDC, Lov_Type_Sales, Lov_Code_Company, Lov_Desc_Company, Active_Flage_Active, Lov_Code_Company_Acc } from '../../../models/lov_type';

import { secretkey, tokenexpires } from '../../../../settings';

export { 
    GetCompany, 
    AddCompany, 
    EditCompany, 
    DeleteCompany,

    GetCompanyAccount,
    AddCompanyAccount,
    EditCompanyAccount
 }

async function GetCompany(req, res, reqBody) {
    try {
        let result = await ServiceGetCompanyConfig()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function AddCompany(req, res, reqBody, authData) {
    if (reqBody.company_code == null) throw new Error("Input not valid")
    if (reqBody.company_name == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let company_code = reqBody.company_code.trim()
    let company_name = reqBody.company_name.trim()
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

        //Set prmlovcheck
        const prmlovcheck = {}
        prmlovcheck['lov_group'] = Lov_Group_SDC
        prmlovcheck['lov_type'] = Lov_Type_Sales
        prmlovcheck['lov_code'] = Lov_Code_Company
        if (company_code) prmlovcheck['lov_1'] = company_code
        // if (company_name) prmlovcheck['lov_2'] = company_name

        let dupdata = await ServiceCheckDuplicate(prmlovcheck)

        //Set object prmlov
        const prmlov = {}
        prmlov['lov_group'] = Lov_Group_SDC
        prmlov['lov_type'] = Lov_Type_Sales
        prmlov['lov_code'] = Lov_Code_Company
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        prmlov['lov_desc'] = Lov_Desc_Company
        prmlov['active_flage'] = Active_Flage_Active
        if (datetime) prmlov['create_date'] = datetime
        if (authData.id) prmlov['create_by'] = authData.id

        if (dupdata) {

            let reslov = await ServiceInsertLov(prmlov)

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
                        new_value: prmlov,
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
                        new_value: prmlov,
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
                    new_value: prmlov,
                    original_value: '',
                }
                await ServiceInsertLogAudit(prmLogAudit1)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
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

async function EditCompany(req, res, reqBody, authData) {
    if (reqBody.company_id == null) throw new Error("Input not valid")
    if (reqBody.company_code == null) throw new Error("Input not valid")
    if (reqBody.company_name == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let company_id = reqBody.company_id.trim()
    let company_code = reqBody.company_code.trim()
    let company_name = reqBody.company_name.trim()
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

        //Set prmlovcheck
        const prmlovcheck = {}
        if (company_id) prmlovcheck['lov_id'] = company_id
        prmlovcheck['lov_group'] = Lov_Group_SDC
        prmlovcheck['lov_type'] = Lov_Type_Sales
        prmlovcheck['lov_code'] = Lov_Code_Company
        if (company_code) prmlovcheck['lov_1'] = company_code


        //Set object prmlov
        const prmlov = {}
        if (company_id) prmlov['lov_id'] = company_id
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        if (datetime) prmlov['update_date'] = datetime
        if (authData.id) prmlov['update_by'] = authData.id

        let tempdata = await ServiceGetLovById(company_id)

        let dupdata = await ServiceCheckEditDuplicate(prmlovcheck)

        if (dupdata) {
            let reslov = await ServiceEditLov(prmlov)

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
                        new_value: prmlov,
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
                        audit_msg: MSGEditUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
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
                    new_value: prmlov,
                    original_value: tempdata.recordset,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
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

async function DeleteCompany(req, res, reqBody, authData) {

    if (reqBody.company_id == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let company_id = reqBody.company_id.trim()
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

        let tempdata = await ServiceGetLovById(company_id)

        let result = await ServiceDeleteLovById(company_id)

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

async function GetCompanyAccount(req, res, reqBody) {
    try {
        let result = await ServiceGetCompanyAccountConfig()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));

    } catch (err) {
        res.sendStatus(500)
    }
}

async function AddCompanyAccount(req, res, reqBody, authData) {
    if (reqBody.company_code == null) throw new Error("Input not valid")
    if (reqBody.company_name == null) throw new Error("Input not valid")
    if (reqBody.report_name == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let company_code = reqBody.company_code.trim()
    let company_name = reqBody.company_name.trim()
    let report_name = reqBody.report_name.trim()
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

        //Set prmlovcheck
        const prmlovcheck = {}
        prmlovcheck['lov_group'] = Lov_Group_SDC
        prmlovcheck['lov_type'] = Lov_Type_Sales
        prmlovcheck['lov_code'] = Lov_Code_Company_Acc
        if (company_code) prmlovcheck['lov_1'] = company_code
        // if (company_name) prmlovcheck['lov_2'] = company_name

        let dupdata = await ServiceCheckDuplicate(prmlovcheck)

        //Set object prmlov
        const prmlov = {}
        prmlov['lov_group'] = Lov_Group_SDC
        prmlov['lov_type'] = Lov_Type_Sales
        prmlov['lov_code'] = Lov_Code_Company_Acc
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        if (report_name) prmlov['lov_3'] = report_name
        prmlov['lov_desc'] = Lov_Desc_Company
        prmlov['active_flage'] = Active_Flage_Active
        if (datetime) prmlov['create_date'] = datetime
        if (authData.id) prmlov['create_by'] = authData.id

        if (dupdata) {

            let reslov = await ServiceInsertLov(prmlov)

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
                        new_value: prmlov,
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
                        new_value: prmlov,
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
                    new_value: prmlov,
                    original_value: '',
                }
                await ServiceInsertLogAudit(prmLogAudit1)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
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

async function EditCompanyAccount(req, res, reqBody, authData) {
    if (reqBody.company_id == null) throw new Error("Input not valid")
    if (reqBody.company_code == null) throw new Error("Input not valid")
    if (reqBody.company_name == null) throw new Error("Input not valid")
    if (reqBody.report_name == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let company_id = reqBody.company_id.trim()
    let company_code = reqBody.company_code.trim()
    let company_name = reqBody.company_name.trim()
    let report_name = reqBody.report_name.trim()
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

        //Set prmlovcheck
        const prmlovcheck = {}
        if (company_id) prmlovcheck['lov_id'] = company_id
        prmlovcheck['lov_group'] = Lov_Group_SDC
        prmlovcheck['lov_type'] = Lov_Type_Sales
        prmlovcheck['lov_code'] = Lov_Code_Company_Acc
        if (company_code) prmlovcheck['lov_1'] = company_code


        //Set object prmlov
        const prmlov = {}
        if (company_id) prmlov['lov_id'] = company_id
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        if (report_name) prmlov['lov_3'] = report_name
        if (datetime) prmlov['update_date'] = datetime
        if (authData.id) prmlov['update_by'] = authData.id

        let tempdata = await ServiceGetLovById(company_id)

        let dupdata = await ServiceCheckEditDuplicate(prmlovcheck)

        if (dupdata) {
            let reslov = await ServiceEditLov(prmlov)

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
                        new_value: prmlov,
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
                        new_value: prmlov,
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
                    new_value: prmlov,
                    original_value: tempdata.recordset,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
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





