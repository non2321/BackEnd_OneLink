const sql = require('mssql') // MS Sql Server client
const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect');
const setting = require('../../../../settings')
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const Store = require('../../../models/Services/Store')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')

const settings = require('../../../../settings')

module.exports.GetAllStore = GetAllStore
module.exports.GetAllBank = GetAllBank
module.exports.GetStoreConfig = GetStoreConfig
module.exports.GetPopupStore = GetPopupStore
module.exports.GetDropDownBank = GetDropDownBank
module.exports.AddStoreConfig = AddStoreConfig
module.exports.EditStoreConfig = EditStoreConfig
module.exports.DeleteStoreConfig = DeleteStoreConfig

async function GetAllStore(req, res, reqBody) {
    try {
        let result = await Store.GetAllStore()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['STORE_ID'], label: items[item]['STORE_NAME'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
       res.sendStatus(500)
    }
}

async function GetAllBank(req, res, reqBody) {
    try {
        let result = await Store.GetAllBank()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['BANK_CODE'], label: items[item]['BANK'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
       res.sendStatus(500)
    }
}

async function GetStoreConfig(req, res, reqBody) {
    try {
        let result = await Store.GetStoreConfig()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
       res.sendStatus(500)
    }
}

async function GetPopupStore(req, res, reqBody) {
    try {
        let result = await Store.GetPopupStore()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
       res.sendStatus(500)
    }
}

async function GetDropDownBank(req, res, reqBody) {
    try {
        let result = await Store.GetDropDownBank()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['BANK_CODE'], label: items[item]['BANK_NAME'] })
          }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)       
    } catch (err) {
       res.sendStatus(500)
    }
}

async function AddStoreConfig(req, res, reqBody, authData) {
    if (reqBody.store_code == null) throw new Error("Input not valid")
    if (reqBody.bank_code == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")
  
    const store_code = reqBody.store_code.trim()
    const bank_code = reqBody.bank_code.trim()
    //Fix CO_CODE = 1
    const co_code = '1'
    const screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''

    try {
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',','');
        console.log(new Date())
        console.log(datetime)
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
        prm['store_code'] = store_code
        prm['co_code'] = co_code
        prm['bank_code'] = bank_code
        if (datetime) prm['create_date'] = datetime
        if (authData.id) prm['create_by'] = authData.id

        const result = await Store.InsertStoreConfig(prm)

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

    } catch (err) {
       res.sendStatus(500)
    }
}

async function EditStoreConfig(req, res, reqBody, authData) {
    if (reqBody.store_code == null) throw new Error("Input not valid")
    if (reqBody.bank_code == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const store_code = reqBody.store_code.trim()
    const bank_code = reqBody.bank_code.trim()
    //Fix CO_CODE = 1
    const co_code = '1'
    const screen_id = reqBody.screen_id
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

        const tempdata = await Store.GetStoreConfigByStoreCode(store_code)

        //Set object prm
        const prm = {}
        prm['store_code'] = store_code
        prm['co_code'] = co_code
        prm['bank_code'] = bank_code
        if (datetime) prm['update_date'] = datetime
        if (authData.id) prm['update_by'] = authData.id

        let result = await Store.EditStoreConfig(prm)

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

            //Add Log.
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
        }
        else {  //Edit UnSuccess
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

    } catch (err) {
       res.sendStatus(500)
    }
}

async function DeleteStoreConfig(req, res, reqBody, authData) {
    if (reqBody.store_code == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    let store_code = reqBody.store_code.trim()
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

        const tempdata = await Store.GetStoreConfigByStoreCode(store_code)     
        const result = await Store.DeleteStoreConfig(store_code)
       
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