const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect')
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const Inventory = require('../../../models/Services/Inventory')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')

const settings = require('../../../../settings')

module.exports.Get = Get
module.exports.GetDropDownGrpBy = GetDropDownGrpBy
module.exports.GetDropDownCatCode = GetDropDownCatCode
module.exports.GetDropDownAccType = GetDropDownAccType
module.exports.Add = Add
module.exports.Edit = Edit

async function Get(req, res, reqBody) {
    try {
        let result = await Inventory.GetAccountCodeForInventory()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
       res.sendStatus(500)
    }
}

async function GetDropDownGrpBy(req, res, reqBody) {
    try {
        let result = await Inventory.GetDropDownGrpBy()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['LOV1'], label: items[item]['LOV_DESC'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetDropDownCatCode(req, res, reqBody) {
    try {
        let result = await Inventory.GetDropDownCatCode()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['LOV1'], label: items[item]['LOV_DESC'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetDropDownAccType(req, res, reqBody) {
    try {
        let result = await Inventory.GetDropDownAccType()

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

async function Add(req, res, reqBody, authData) {
    if (reqBody.action_code == null) throw new Error("Input not valid")
    if (reqBody.inv_class == null) throw new Error("Input not valid")
    if (reqBody.action == null) throw new Error("Input not valid")
    if (reqBody.obj_account == null) throw new Error("Input not valid")
    if (reqBody.subsidary == null) throw new Error("Input not valid")
    if (reqBody.grp_by == null) throw new Error("Input not valid")
    if (reqBody.cat_code == null) throw new Error("Input not valid")
    if (reqBody.acc_type == null) throw new Error("Input not valid")
    if (reqBody.doc_no == null) throw new Error("Input not valid")
    if (reqBody.remark == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const action_code = reqBody.action_code.trim()
    const inv_class = reqBody.inv_class.trim()
    const action = reqBody.action.trim()
    const obj_account = reqBody.obj_account.trim()
    const subsidary = reqBody.subsidary.trim()
    const grp_by = reqBody.grp_by.trim()
    const cat_code = reqBody.cat_code.trim()
    const acc_type = reqBody.acc_type.trim()
    const doc_no = reqBody.doc_no.trim()
    const remark = reqBody.remark.trim()
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
        const prmchk = {
            action_code: action_code,
            inv_class: inv_class,
            acc_type: acc_type
        }
        let dupdata = await Inventory.CheckDuplicateAccountCodeForInventory(prmchk)

        //Set object prm
        const prm = {
            action_code: action_code,
            inv_class: inv_class,
            action: action,
            obj_account: obj_account,
            subsidary: subsidary,
            grp_by: grp_by,
            cat_code: cat_code,
            acc_type: acc_type,
            doc_no: doc_no,
            remark: remark,
            create_date: datetime,
            create_by: authData.id
        }

        if (dupdata) {
            let result = await Inventory.InsertAccountCodeForInventory(prm)

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
                msg: msg_type.AddDuplicate,
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
                action_code: prm.action_code,
                inv_class: prm.inv_class,
                acc_type: prm.acc_type
            }
            //Get Message Alert.
            const messageAlert = await message.GetMessageByCode(msg_type.CodeE0005, prmMsg)
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

async function Edit(req, res, reqBody, authData) {
    if (reqBody.action_code == null) throw new Error("Input not valid")
    if (reqBody.inv_class == null) throw new Error("Input not valid")
    if (reqBody.action == null) throw new Error("Input not valid")
    if (reqBody.obj_account == null) throw new Error("Input not valid")
    if (reqBody.subsidary == null) throw new Error("Input not valid")
    if (reqBody.grp_by == null) throw new Error("Input not valid")
    if (reqBody.cat_code == null) throw new Error("Input not valid")
    if (reqBody.acc_type == null) throw new Error("Input not valid")
    if (reqBody.doc_no == null) throw new Error("Input not valid")
    if (reqBody.remark == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const action_code = reqBody.action_code
    const inv_class = reqBody.inv_class.trim()
    const action = reqBody.action.trim()
    const obj_account = reqBody.obj_account.trim()
    const subsidary = reqBody.subsidary.trim()
    const grp_by = reqBody.grp_by.trim()
    const cat_code = reqBody.cat_code.trim()
    const acc_type = reqBody.acc_type.trim()
    const doc_no = reqBody.doc_no.trim()
    const remark = reqBody.remark.trim()
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
        //Set prmtemp
        const prmtemp = {
            action_code: action_code,
            inv_class: inv_class,
            acc_type: acc_type
        }
        const tempdata = await Inventory.GetTempAccountCodeForInventory(prmtemp)

        //Set object prm
        const prm = {
            action_code: action_code,
            inv_class: inv_class,
            action: action,
            obj_account: obj_account,
            subsidary: subsidary,
            grp_by: grp_by,
            cat_code: cat_code,
            acc_type: acc_type,
            doc_no: doc_no,
            remark: remark,
            update_date: datetime,
            update_by: authData.id
        }

        let result = await Inventory.EditAccountCodeForInventory(prm)

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

