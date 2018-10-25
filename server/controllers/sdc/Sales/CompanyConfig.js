const sql = require('mssql') // MS Sql Server client
const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect');
const setting = require('../../../../settings')
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const lov = require('../../../models/Services/Lov')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')
const lov_type = require('../../../models/lov_type')

const settings = require('../../../../settings')

module.exports.GetCompany = GetCompany
module.exports.AddCompany = AddCompany
module.exports.EditCompany = EditCompany
module.exports.DeleteCompany = DeleteCompany

module.exports.GetCompanyAccount = GetCompanyAccount
module.exports.AddCompanyAccount = AddCompanyAccount
module.exports.EditCompanyAccount = EditCompanyAccount

async function GetCompany(req, res, reqBody) {
    try {
        let result = await lov.GetCompanyConfig()
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
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        //Set prmlovcheck
        const prmlovcheck = {}
        prmlovcheck['lov_group'] = lov_type.Lov_Group_SDC
        prmlovcheck['lov_type'] = lov_type.Lov_Type_Sales
        prmlovcheck['lov_code'] = lov_type.Lov_Code_Company
        if (company_code) prmlovcheck['lov_1'] = company_code
        // if (company_name) prmlovcheck['lov_2'] = company_name

        let dupdata = await lov.CheckDuplicate(prmlovcheck)

        //Set object prmlov
        const prmlov = {}
        prmlov['lov_group'] = lov_type.Lov_Group_SDC
        prmlov['lov_type'] = lov_type.Lov_Type_Sales
        prmlov['lov_code'] = lov_type.Lov_Code_Company
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        prmlov['lov_desc'] = lov_type.Lov_Desc_Company
        prmlov['active_flage'] = lov_type.Active_Flage_Active
        if (datetime) prmlov['create_date'] = datetime
        if (authData.id) prmlov['create_by'] = authData.id

        if (dupdata) {

            let reslov = await lov.InsertLov(prmlov)

            if (reslov !== undefined) { //Insert Success            
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
                if (AuditTrail.uid) {
                    //Add Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Add,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Success,
                        audit_msg: msg_type.AddSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
                        original_value: '',
                    }
                    await log.InsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                let messageAlert = await message.GetMessageByCode(msg_type.CodeS0001)

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
            } else {  //Insert UnSuccess
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
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Add,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Error,
                        audit_msg: msg_type.AddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
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
        } else { //Duplicate Data
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
                const prmLogAudit1 = {
                    audit_date: datetime,
                    action_type: action_type.Add,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Error,
                    audit_msg: msg_type.AddDuplicate,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prmlov,
                    original_value: '',
                }
                await log.InsertLogAudit(prmLogAudit1)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
            }
            //Get Message Alert.
            const messageAlert = await message.GetMessageByCode(msg_type.CodeE0001, prmMsg)
            const data = {
                "status": status_type.UnComplate,
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
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        //Set prmlovcheck
        const prmlovcheck = {}
        if (company_id) prmlovcheck['lov_id'] = company_id
        prmlovcheck['lov_group'] = lov_type.Lov_Group_SDC
        prmlovcheck['lov_type'] = lov_type.Lov_Type_Sales
        prmlovcheck['lov_code'] = lov_type.Lov_Code_Company
        if (company_code) prmlovcheck['lov_1'] = company_code


        //Set object prmlov
        const prmlov = {}
        if (company_id) prmlov['lov_id'] = company_id
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        if (datetime) prmlov['update_date'] = datetime
        if (authData.id) prmlov['update_by'] = authData.id

        let tempdata = await lov.GetLovById(company_id)

        let dupdata = await lov.CheckEditDuplicate(prmlovcheck)

        if (dupdata) {
            let reslov = await lov.EditLov(prmlov)

            if (reslov !== undefined) { //Edit Success            
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
                if (AuditTrail.uid) {
                    //Add Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Edit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Success,
                        audit_msg: msg_type.EditSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
                        original_value: tempdata.recordset,
                    }
                    await log.InsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                let messageAlert = await message.GetMessageByCode(msg_type.CodeS0002)

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
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Edit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Error,
                        audit_msg: msg_type.EditUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
                        original_value: tempdata.recordset,
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
        } else { //Dupicate Date
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
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Edit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Error,
                    audit_msg: msg_type.EditDuplicate,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prmlov,
                    original_value: tempdata.recordset,
                }
                await log.InsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
            }
            //Get Message Alert.
            const messageAlert = await message.GetMessageByCode(msg_type.CodeE0001, prmMsg)
            const data = {
                "status": status_type.UnComplate,
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
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        let tempdata = await lov.GetLovById(company_id)

        let result = await lov.DeleteLovById(company_id)

        if (result !== undefined) { //Delete Success 
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.Delete,
                status: status_type.Success,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.DeleteSuccess,
                browser: browser
            }

            // Add Log.
            let AuditTrail = await log.InsertLogAuditTrail(prmLog)


            if (AuditTrail.uid) {
                //Add Log Audit         
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Delete,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Success,
                    audit_msg: msg_type.DeleteSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: '',
                    original_value: tempdata.recordset,
                }
                await log.InsertLogAudit(prmLogAudit)
            }

            //Get Message Alert.
            let messageAlert = await message.GetMessageByCode(msg_type.CodeS0003)

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
                action_type: action_type.Delete,
                status: status_type.Error,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.DeleteUnSuccess,
                browser: browser
            }
            // Add Log.
            let AuditTrail = await log.InsertLogAuditTrail(prmLog)

            if (AuditTrail.uid) {
                //Add Log Audit         
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Delete,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Error,
                    audit_msg: msg_type.DeleteUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: '',
                    original_value: tempdata.recordset,
                }
                await log.InsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////            
            const data = {
                "status": status_type.UnComplate,
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
        let result = await lov.GetCompanyAccountConfig()
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
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        //Set prmlovcheck
        const prmlovcheck = {}
        prmlovcheck['lov_group'] = lov_type.Lov_Group_SDC
        prmlovcheck['lov_type'] = lov_type.Lov_Type_Sales
        prmlovcheck['lov_code'] = lov_type.Lov_Code_Company_Acc
        if (company_code) prmlovcheck['lov_1'] = company_code
        // if (company_name) prmlovcheck['lov_2'] = company_name

        let dupdata = await lov.CheckDuplicate(prmlovcheck)

        //Set object prmlov
        const prmlov = {}
        prmlov['lov_group'] = lov_type.Lov_Group_SDC
        prmlov['lov_type'] = lov_type.Lov_Type_Sales
        prmlov['lov_code'] = lov_type.Lov_Code_Company_Acc
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        if (report_name) prmlov['lov_3'] = report_name
        prmlov['lov_desc'] = lov_type.Lov_Desc_Company
        prmlov['active_flage'] = lov_type.Active_Flage_Active
        if (datetime) prmlov['create_date'] = datetime
        if (authData.id) prmlov['create_by'] = authData.id

        if (dupdata) {

            let reslov = await lov.InsertLov(prmlov)

            if (reslov !== undefined) { //Insert Success            
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
                if (AuditTrail.uid) {
                    //Add Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Add,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Success,
                        audit_msg: msg_type.AddSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
                        original_value: '',
                    }
                    await log.InsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                let messageAlert = await message.GetMessageByCode(msg_type.CodeS0001)

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
            } else {  //Insert UnSuccess
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
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Add,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Error,
                        audit_msg: msg_type.AddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
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
        } else { //Duplicate Data
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
                const prmLogAudit1 = {
                    audit_date: datetime,
                    action_type: action_type.Add,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Error,
                    audit_msg: msg_type.AddDuplicate,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prmlov,
                    original_value: '',
                }
                await log.InsertLogAudit(prmLogAudit1)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
            }
            //Get Message Alert.
            const messageAlert = await message.GetMessageByCode(msg_type.CodeE0001, prmMsg)
            const data = {
                "status": status_type.UnComplate,
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
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        //Set prmlovcheck
        const prmlovcheck = {}
        if (company_id) prmlovcheck['lov_id'] = company_id
        prmlovcheck['lov_group'] = lov_type.Lov_Group_SDC
        prmlovcheck['lov_type'] = lov_type.Lov_Type_Sales
        prmlovcheck['lov_code'] = lov_type.Lov_Code_Company_Acc
        if (company_code) prmlovcheck['lov_1'] = company_code


        //Set object prmlov
        const prmlov = {}
        if (company_id) prmlov['lov_id'] = company_id
        if (company_code) prmlov['lov_1'] = company_code
        if (company_name) prmlov['lov_2'] = company_name
        if (report_name) prmlov['lov_3'] = report_name
        if (datetime) prmlov['update_date'] = datetime
        if (authData.id) prmlov['update_by'] = authData.id

        let tempdata = await lov.GetLovById(company_id)

        let dupdata = await lov.CheckEditDuplicate(prmlovcheck)

        if (dupdata) {
            let reslov = await lov.EditLov(prmlov)

            if (reslov !== undefined) { //Edit Success            
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
                if (AuditTrail.uid) {
                    //Add Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Edit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Success,
                        audit_msg: msg_type.EditSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
                        original_value: tempdata.recordset,
                    }
                    await log.InsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                let messageAlert = await message.GetMessageByCode(msg_type.CodeS0002)

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
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: action_type.Edit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: status_type.Error,
                        audit_msg: msg_type.AddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prmlov,
                        original_value: tempdata.recordset,
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
        } else { //Dupicate Date
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
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Edit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Error,
                    audit_msg: msg_type.EditDuplicate,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prmlov,
                    original_value: tempdata.recordset,
                }
                await log.InsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                company_code: company_code,
            }
            //Get Message Alert.
            const messageAlert = await message.GetMessageByCode(msg_type.CodeE0001, prmMsg)
            const data = {
                "status": status_type.UnComplate,
                "message": messageAlert,
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}





