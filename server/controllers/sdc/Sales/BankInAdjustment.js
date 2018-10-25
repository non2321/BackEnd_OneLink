const sql = require('mssql') // MS Sql Server client
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


module.exports.GetBankInAdjustment = GetBankInAdjustment
module.exports.GetPopupStore = GetPopupStore
module.exports.GetValidationstore = GetValidationstore
module.exports.GetValidationfinancialcode = GetValidationfinancialcode
module.exports.EditBankInAdjustment = EditBankInAdjustment
module.exports.ImportBankInAdjustment = ImportBankInAdjustment
module.exports.GenGLBankInAdjustment = GenGLBankInAdjustment

async function GetBankInAdjustment(req, res, reqBody) {
    try {
        if (req.params.store == null) throw new Error("Input not valid")
        if (req.params.dateofstore == null) throw new Error("Input not valid")

        let store = req.params.store
        let dateofstore = req.params.dateofstore

        let result = await Financial.GetBankInAdjustment(store, dateofstore)
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
        let result = await Financial.GetPopupStoreBankInAdjustment()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetValidationstore(req, res, reqBody) {
    try {
        let result = await Financial.GetValidationstoreBankInAdjustment()
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(result.recordset));
    } catch (err) {
        res.sendStatus(500)
    }
}

//validationfinancialcode
async function GetValidationfinancialcode(req, res, reqBody) {
    try {
        let result = await Financial.GetValidationfinancialcodeBankInAdjustment()
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(result.recordset));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function EditBankInAdjustment(req, res, obj, authData) {
    if (obj == null) throw new Error("Input not valid")
    let screen_id = obj[0].screen_id
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

        let rescheck = true
        let itemsuccess = []
        let itemerror = []

        for (let item of obj) {
            const tempdata = await Financial.GetDailyFinsByData(item)
            const prm = {
                store_id: item.store_id,
                fin_code: item.fin_code,
                fin_date: item.fin_date,
                daily_fin: item.daily_fin,
                store_daily_fin: item.store_daily_fin,
                update_date: datetime,
                update_by: authData.id
            }
            const res = await Financial.EditBankInAdjustment(prm)

            if (res != undefined) {
                const prmitem = {
                    store_id: item.store_id,
                    fin_code: item.fin_code,
                    fin_date: item.fin_date,
                    daily_fin: item.daily_fin,
                    store_daily_fin: item.store_daily_fin,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemsuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    store_id: item.store_id,
                    fin_code: item.fin_code,
                    fin_date: item.fin_date,
                    daily_fin: item.daily_fin,
                    store_daily_fin: item.store_daily_fin,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemerror.push(prmitem)
                rescheck = false
            }
        }

        //Add Log Audit Success     
        for (let item of itemsuccess) {
            const new_value = {
                store_id: item.store_id,
                fin_code: item.fin_code,
                fin_date: item.fin_date,
                daily_fin: item.daily_fin,
                store_daily_fin: item.store_daily_fin,
                update_date: item.update_date,
                update_by: item.update_by,
            }
            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Edit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Success,
                    audit_msg: msg_type.EditSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await log.InsertLogAudit(prmLogAudit)
            }
        }

        //Add Log Audit Error
        for (let item of itemerror) {
            const new_value = {
                store_id: item.store_id,
                fin_code: item.fin_code,
                fin_date: item.fin_date,
                daily_fin: item.daily_fin,
                store_daily_fin: item.store_daily_fin,
                update_date: item.update_date,
                update_by: item.update_by,
            }

            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Edit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Error,
                    audit_msg: msg_type.EditUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await log.InsertLogAudit(prmLogAudit)
            }
        }


        //Respone Success
        if (rescheck == true) {
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
        } else { //Respone Error
            const data = {
                "status": status_type.UnComplate,
                "message": `Financial Code ${itemerror.map((item) => { return item['fin_code'] })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function ImportBankInAdjustment(req, res, obj, authData) {
    if (obj == null) throw new Error("Input not valid")
    if (req.body.screen_id == null) throw new Error("Input not valid")
    let screen_id = req.body.screen_id
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

        const prmLog = {
            audit_trail_date: datetime,
            module: module_name,
            screen_name: screen_name,
            action_type: action_type.EditUpload,
            status: status_type.Success,
            user_id: authData.id,
            client_ip: req.ip,
            msg: msg_type.EditUploadSuccess,
            browser: browser
        }

        // Add Log.
        let AuditTrail = await log.InsertLogAuditTrail(prmLog)

        let rescheck = true
        let itemsuccess = []
        let itemerror = []

        for (let item of obj) {
            let fin_date = item['Financial Date'].split("/")
            let itemfin_date = `${fin_date[2]}/${fin_date[1]}/${fin_date[0]}`
            const prm = {
                store_id: item['Store ID'],
                fin_code: item['Financial Code'],
                fin_date: itemfin_date,
                daily_fin: item['Account Daily Fins'],
                // store_daily_fin: item.store_daily_fin,
                update_date: datetime,
                update_by: authData.id
            }
            const tempdata = await Financial.GetDailyFinsByData(prm)

            const res = await Financial.EditBankInAdjustment(prm)

            if (res != undefined) {
                const prmitem = {
                    store_id: item['Store ID'],
                    fin_code: item['Financial Code'],
                    fin_date: itemfin_date,
                    daily_fin: item['Account Daily Fins'],
                    // store_daily_fin: item.store_daily_fin,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemsuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    store_id: item['Store ID'],
                    fin_code: item['Financial Code'],
                    fin_date: itemfin_date,
                    daily_fin: item['Account Daily Fins'],
                    // store_daily_fin: item.store_daily_fin,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemerror.push(prmitem)
                rescheck = false
            }
        }
        //Add Log Audit Success     
        for (let item of itemsuccess) {
            const new_value = {
                store_id: item.store_id,
                fin_code: item.fin_code,
                fin_date: item.fin_date,
                daily_fin: item.daily_fin,
                // store_daily_fin: item.store_daily_fin,
                update_date: item.update_date,
                update_by: item.update_by,
            }
            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Edit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Success,
                    audit_msg: msg_type.EditUploadSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await log.InsertLogAudit(prmLogAudit)
            }
        }

        //Add Log Audit Error
        for (let item of itemerror) {
            const new_value = {
                store_id: item.store_id,
                fin_code: item.fin_code,
                fin_date: item.fin_date,
                daily_fin: item.daily_fin,
                // store_daily_fin: item.store_daily_fin,,
                update_date: item.update_date,
                update_by: item.update_by,
            }

            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: action_type.Edit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: status_type.Error,
                    audit_msg: msg_type.EditUploadUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await log.InsertLogAudit(prmLogAudit)
            }
        }


        //Respone Success
        if (rescheck == true) {
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
        } else { //Respone Error
            const data = {
                "status": status_type.UnComplate,
                "message": `Financial Code ${itemerror.map((item) => { return item['fin_code'] })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GenGLBankInAdjustment(req, res, reqBody, authData) {
    if (reqBody.gldoc_type == null) throw new Error("Input not valid")
    if (reqBody.glledger_type == null) throw new Error("Input not valid")
    if (reqBody.glfrom_date == null) throw new Error("Input not valid")
    if (reqBody.glto_date == null) throw new Error("Input not valid")
    if (reqBody.glfrom_store == null) throw new Error("Input not valid")
    if (reqBody.glto_store == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const gldoc_type = reqBody.gldoc_type.trim()
    const glledger_type = reqBody.glledger_type.trim()
    const glfrom_date = reqBody.glfrom_date.trim()
    const glto_date = reqBody.glto_date.trim()
    const glfrom_store = reqBody.glfrom_store.trim()
    const glto_store = reqBody.glto_store.trim()
    const screen_id = reqBody.screen_id.trim()

    
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
        const prm = {
            gldoc_type: gldoc_type,
            glledger_type: glledger_type,
            glfrom_date: glfrom_date,
            glto_date: glto_date,
            glfrom_store: glfrom_store,
            glto_store: glto_store
        }

        let result = await Financial.GenGLBankInAdjustment(prm)
        if (result !== undefined) {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.CallProcedures,
                status: status_type.Success,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.Procedures_GEN_GL_TO_E1,
                browser: browser
            }

            // Add Log.
            let AuditTrail = await log.InsertLogAuditTrail(prmLog)

            let GLSales = ''
         
            for (let item of result) {
                let GLSalesitem = ''
                GLSalesitem = (item.AccMode.trim() == '') ? [' ', GLSalesitem].join("|") : [item.AccMode, GLSalesitem].join("|")
                GLSalesitem = (item.Company.trim() == '') ? [' ', GLSalesitem].join("|") : [item.Company, GLSalesitem].join("|")
                GLSalesitem = (item.CurrencyCode.trim() == '') ? [' ', GLSalesitem].join("|") : [item.CurrencyCode, GLSalesitem].join("|")
                GLSalesitem = (item.Mode.trim() == '') ? [' ', GLSalesitem].join("|") : [item.Mode, GLSalesitem].join("|")
                GLSalesitem = (item.ledgerType.trim() == '') ? [' ', GLSalesitem].join("|") : [item.ledgerType, GLSalesitem].join("|")
                GLSalesitem = (item.Explain.trim() == '') ? [' ', GLSalesitem].join("|") : [item.Explain, GLSalesitem].join("|")
                GLSalesitem = (item.glDate.trim() == '') ? [' ', GLSalesitem].join("|") : [item.glDate, GLSalesitem].join("|")
                GLSalesitem = (item.subLedger.trim() == '') ? [' ', GLSalesitem].join("|") : [item.subLedger, GLSalesitem].join("|")
                GLSalesitem = (item.subLedgerType.trim() == '') ? [' ', GLSalesitem].join("|") : [item.subLedgerType, GLSalesitem].join("|")
                GLSalesitem = (item.amount.trim() == '') ? [' ', GLSalesitem].join("|") : [item.amount, GLSalesitem].join("|")
                GLSalesitem = (item.accountCode.trim() == '') ? [' ', GLSalesitem].join("|") : [item.accountCode, GLSalesitem].join("|")
                GLSalesitem = (item.remark.trim() == '') ? [' ', GLSalesitem].join("|") : [item.remark, GLSalesitem].join("|")
                GLSalesitem = (item.rowNum.trim() == '') ? [' ', GLSalesitem].join("|") : [item.rowNum, GLSalesitem].join("|")
                GLSalesitem = (item.DocCom.trim() == '') ? [' ', GLSalesitem].join("|") : [item.DocCom, GLSalesitem].join("|")
                GLSalesitem = (item.DocType.trim() == '') ? [' ', GLSalesitem].join("|") : [item.DocType, GLSalesitem].join("|")
                GLSalesitem = (item.DocNo.trim() == '') ? [' ', GLSalesitem].join("|") : [item.DocNo, GLSalesitem].join("|")
                GLSales += `${GLSalesitem}\r\n`
            }

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=GLSALES_PH.txt');

            res.send(GLSales);

        } else {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: action_type.CallProcedures,
                status: status_type.Error,
                user_id: authData.id,
                client_ip: req.ip,
                msg: msg_type.Procedures_GEN_GL_TO_E1,
                browser: browser
            }

            // Add Log.
            let AuditTrail = await log.InsertLogAuditTrail(prmLog)

            let GLSales = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=GLSALES_PH.txt');

            res.send(GLSales);
        }
        
    } catch (err) {
        res.sendStatus(500)
    }

}