const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect')
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const Financial = require('../../../models/Services/Financial')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')

const settings = require('../../../../settings')

module.exports.GetAccountCode = GetAccountCode
module.exports.AddAccountCode = AddAccountCode
module.exports.EditAccountCode = EditAccountCode
module.exports.GetDropDownBuType = GetDropDownBuType
module.exports.GetDropDownType = GetDropDownType

async function GetAccountCode(req, res, reqBody) {
    try {
        let result = await Financial.GetAccountCodeForSale()
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
    let screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''

    try {
        // Current DateTime
        const datetime = new Date().toLocaleString();
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        let dupdata = await Financial.CheckDuplicateAccountCodeForSale(formular_name)

        //Set object prm
        const prm = {}
        prm['formular_name'] = formular_name
        prm['account_code'] = account_code
        prm['bu_type'] = bu_type
        prm['type'] = type
        prm['subledger_type'] = subledger_type
        prm['subledger'] = subledger
        if (datetime) prm['create_date'] = datetime
        if (authData.id) prm['create_by'] = authData.id

        if (dupdata) {

            let result = await Financial.InsertAccountCodeForSale(prm)

            if (result !== undefined) { //Insert Success            
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
                        new_value: prm,
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
                        new_value: prm,
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
                    new_value: prm,
                    original_value: '',
                }
                await log.InsertLogAudit(prmLogAudit1)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                formular_name: formular_name,
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
    let screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''

    try {
        // Current DateTime
        const datetime = new Date().toLocaleString();
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }
        let tempdata = await Financial.GetAccountCodeForSaleById(formular_id)

        //Set prmcheck
        const prmcheck = {}
        prmcheck['formular_id'] = formular_id
        prmcheck['formular_name'] = formular_name
        let dupdata = await Financial.CheckEditDuplicateAccountCodeForSale(prmcheck)

        //Set object prm
        const prm = {}
        prm['formular_id'] = formular_id
        prm['formular_name'] = formular_name
        prm['account_code'] = account_code
        prm['bu_type'] = bu_type
        prm['type'] = type
        prm['subledger_type'] = subledger_type
        prm['subledger'] = subledger
        if (datetime) prm['update_date'] = datetime
        if (authData.id) prm['update_by'] = authData.id

        if (dupdata) {
            let result = await Financial.EditAccountCodeForSale(prm)

            if (result !== undefined) { //Edit Success            
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
                        new_value: prm,
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
                        new_value: prm,
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
                    new_value: prm,
                    original_value: tempdata.recordset,
                }
                await log.InsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                formular_name: formular_name,
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

async function GetDropDownBuType(req, res, reqBody) {
    try {
        let result = await Financial.GetDropDownBuType()

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
        let result = await Financial.GetDropDownType()

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