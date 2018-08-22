const sql = require('mssql') // MS Sql Server client
const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect');
const setting = require('../../../../settings')
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const Financial = require('../../../models/Services/Financial')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')

const settings = require('../../../../settings')

module.exports.GetBankAccount = GetBankAccount
module.exports.AddBankAccount = AddBankAccount
module.exports.EditBankAccount = EditBankAccount
module.exports.DeleteBankAccount = DeleteBankAccount

async function GetBankAccount(req, res, reqBody) {
    try {
        let result = await Financial.GetBankAccount()
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
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }      

        let dupdata = await Financial.CheckDuplicateBankAccount(bank_code)

        //Set object prm
        const prm = {}
        prm['bank_code'] = bank_code
        prm['bank_name'] = bank_name
        prm['bank_branch'] = bank_branch
        if (account_code) prm['account_code'] = account_code       
        if (datetime) prm['create_date'] = datetime
        if (authData.id) prm['create_by'] = authData.id

        if (dupdata) {

            let reslov = await Financial.InsertBankAccount(prm)

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
                bank_code: bank_code,
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
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

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

        let tempdata = await Financial.GetBankAccountById(bank_code)      
        let reslov = await Financial.EditBankAccount(prm)
       
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
                    audit_msg: msg_type.AddUnSuccess,
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
        const datetime = new Date().toLocaleString().replace(',','');
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']));

        //Get Screen name && Module name
        const screen = await menu.GetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        let tempdata = await Financial.GetBankAccountById(bank_code)
      
        let result = await Financial.DeleteBankAccountById(bank_code)

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
