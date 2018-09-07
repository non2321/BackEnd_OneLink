const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect')
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const Inventory = require('../../../models/Services/Inventory')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')
const utils = require('../../../models/Services/utils')

const settings = require('../../../../settings')

module.exports.GetDataTable = GetDataTable
module.exports.Add = Add
module.exports.Edit = Edit

async function GetDataTable(req, res, reqBody) {
    try {
        const result = await Inventory.GetTermClosing()

        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function Add(req, res, reqBody, authData) {
    if (reqBody.year == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const year = reqBody.year.toString().trim()
    const screen_id = reqBody.screen_id
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

        const prmchk = {
            year: year,
        }
        const dupdata = await Inventory.CheckDuplicateTermClosingYear(prmchk)

        //Set object prm
        const prm = {
            year: year,
            create_date: datetime,
            create_by: authData.id
        }

        if (dupdata) {
            //Check Periods
            const checkPeriods = await Inventory.CheckPeriodsTermClosing(prm)
            if (checkPeriods) {
                let result = await Inventory.GetTermClosingForInsert(prm)
                for (let item of result) {
                    const prmInsert = {
                        term_id: await utils.GetCountACC_TERM_CLOSING(),
                        period_id: item['PERIOD_ID'],
                        pb_date: item['PB_DATE'],
                        pe_date: item['PE_DATE'],
                        create_date: prm.create_date,
                        create_by: prm.create_by
                    }
                    await Inventory.InsertTermClosing(prmInsert)
                }
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
            } else {
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
                        audit_msg: msg_type.AddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prm,
                        original_value: '',
                    }
                    await log.InsertLogAudit(prmLogAudit1)
                }

                ////////////////////// Alert Message JSON //////////////////////            

                //Get Message Alert.
                const messageAlert = await message.GetMessageByCode(msg_type.CodeE0008)
                const data = {
                    "status": status_type.UnComplate,
                    "message": messageAlert,
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

            //Get Message Alert.
            const messageAlert = await message.GetMessageByCode(msg_type.CodeE0007)
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

async function Edit(req, res, obj, authData) {
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
            const tempdata = await Inventory.GetTermClosingById(item.term_id)
            const prm = {
                term_id: item.term_id,
                pb_date: item.pb_date,
                pe_date: item.pe_date,
                update_date: datetime,
                update_by: authData.id
            }
            const res = await Inventory.EditTermClosing(prm)
            if (res != undefined) {
                const prmitem = {
                    term_id: item.term_id,
                    pb_date: item.pb_date,
                    pe_date: item.pe_date,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemsuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    term_id: item.term_id,
                    pb_date: item.pb_date,
                    pe_date: item.pe_date,
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
                term_id: item.term_id,
                pb_date: item.pb_date,
                pe_date: item.pe_date,
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
                term_id: item.term_id,
                pb_date: item.pb_date,
                pe_date: item.pe_date,
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
                "message": `Term Closing ${itemerror.map((item) => { return item['term_id'] })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }           
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}