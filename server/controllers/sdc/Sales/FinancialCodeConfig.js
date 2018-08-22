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

module.exports.GetFinancialCode = GetFinancialCode
module.exports.EditFinancialCode = EditFinancialCode

async function GetFinancialCode(req, res, reqBody) {
    try {
        let result = await Financial.GetFinancialCode()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
       res.sendStatus(500)
    }
}

async function EditFinancialCode(req, res, obj, authData) {
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
            const tempdata = await Financial.GetFinancialCodeById(item.fin_code)           
            const prmfin = {
                fin_code: item.fin_code,
                fin_desc: item.fin_desc,
                fin_flag: item.fin_flag,
                update_date: datetime,
                update_by: authData.id
            }
            const res = await Financial.EditFinancialCode(prmfin)
            if (res != undefined) {
                const prmitem = {
                    fin_code: item.fin_code,
                    fin_desc: item.fin_desc,
                    fin_flag: item.fin_flag,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }  
                itemsuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    fin_code: item.fin_code,
                    fin_desc: item.fin_desc,
                    fin_flag: item.fin_flag,
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
                fin_code: item.fin_code,
                fin_desc: item.fin_desc,
                fin_flag: item.fin_flag,
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
                fin_code: item.fin_code,
                fin_desc: item.fin_desc,
                fin_flag: item.fin_flag,
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
        } else { //Respone Error
            const data = {
                "status": status_type.UnComplate,
                "message": `Financial Code ${itemsuccess.map((item)=>{return item['fin_code']})} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
       res.sendStatus(500)
    }
}

