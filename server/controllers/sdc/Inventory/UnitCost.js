import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceGetUnitCost, ServiceGetUnitCostDropDownInvenCategory, ServiceGetUnitCostByData, ServiceEditUnitCost, ServiceGenUnitCost, ServiceGetValidationInvItemUnitCost } from '../../../models/Services/Inventory';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionEdit, ActionEditUpload, ActionCallProcedures } from '../../../models/action_type';
import { StatusSuccess, StatusError, StatusComplate, StatusUnComplate } from '../../../models/status_type';
import { MSGEditSuccess, MSGEditUnSuccess, CodeS0002, MSGEditUploadSuccess, MSGEditUploadUnSuccess, MSGProcedures_GEN_IVENTORY_TO_E1 } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings';

export {
    GetDataTableUnitCost,
    GetDropDownInvenCategory,
    EditUnitCost,
    ImportUnitCost,
    GetValidationInvItem,
    GenInveotory
}

async function GetDataTableUnitCost(req, res, reqBody) {
    try {
        if (req.params.period == null) throw new Error("Input not valid")

        const period = req.params.period.toString().trim()
        const invencategory = (req.params.invencategory) ? req.params.invencategory.toString().trim() : undefined
        const stockno = (req.params.stockno) ? req.params.stockno.toString().trim() : undefined

        const prm = {
            period: period,
            invencategory: (invencategory == 'undefined') ? undefined : invencategory,
            stockno: (stockno == 'undefined') ? undefined : stockno,
        }

        const result = await ServiceGetUnitCost(prm)

        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetDropDownInvenCategory(req, res, reqBody) {
    try {
        let result = await ServiceGetUnitCostDropDownInvenCategory()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['INV_ITEM_CLASS'], label: items[item]['INV_ITEM_CL_DESC'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}

async function EditUnitCost(req, res, obj, authData) {
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
        const screen = await ServiceGetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

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

        // Add Log.
        let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

        let rescheck = true
        let itemStatusSuccess = []
        let itemerror = []


        for (let item of obj) {
            const tempdata = await ServiceGetUnitCostByData(item)

            const prm = {
                period: item.period,
                inv_item: item.inv_item,
                unitcost: item.unitcost,
                countunit: item.countunit,
                update_date: datetime,
                update_by: authData.id
            }
            const res = await ServiceEditUnitCost(prm)

            if (res != undefined) {
                const prmitem = {
                    period: item.period,
                    inv_item: item.inv_item,
                    unitcost: item.unitcost,
                    countunit: item.countunit,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemStatusSuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    period: item.period,
                    inv_item: item.inv_item,
                    unitcost: item.unitcost,
                    countunit: item.countunit,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemerror.push(prmitem)
                rescheck = false
            }
        }

        //Add Log Audit StatusSuccess     
        for (let item of itemStatusSuccess) {
            const new_value = {
                period: item.period,
                inv_item: item.inv_item,
                unitcost: item.unitcost,
                countunit: item.countunit,
                update_date: item.update_date,
                update_by: item.update_by,
            }
            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusSuccess,
                    audit_msg: MSGEditSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }

        //Add Log Audit Error
        for (let item of itemerror) {
            const new_value = {
                period: item.period,
                inv_item: item.inv_item,
                unitcost: item.unitcost,
                countunit: item.countunit,
                update_date: item.update_date,
                update_by: item.update_by,
            }

            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGEditUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }


        //Respone StatusSuccess
        if (rescheck == true) {
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
        } else { //Respone Error
            const data = {
                "status": StatusUnComplate,
                "message": `UnitCost ${itemerror.map((item) => { return `Period: ${item['period']} , InvItem: ${item['inv_item']}` })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function ImportUnitCost(req, res, obj, authData) {
    if (obj == null) throw new Error("Input not valid")
    if (req.body.screen_id == null) throw new Error("Input not valid")
    let screen_id = req.body.screen_id
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

        const prmLog = {
            audit_trail_date: datetime,
            module: module_name,
            screen_name: screen_name,
            action_type: ActionEditUpload,
            status: StatusSuccess,
            user_id: authData.id,
            client_ip: req.ip,
            msg: MSGEditUploadSuccess,
            browser: browser
        }

        // Add Log.
        let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

        let rescheck = true
        let itemStatusSuccess = []
        let itemerror = []

        for (let item of obj) {
            const prm = {
                period: item['Period'],
                stockno: item['Stock No'],
                inv_item: item['Inv Item'],
                unitcost: item['Unit Cost'],
                countunit: item['Unit'],
                update_date: datetime,
                update_by: authData.id
            }
            const tempdata = await ServiceGetUnitCostByData(prm)

            const res = await ServiceEditUnitCost(prm)

            if (res != undefined) {
                const prmitem = {
                    period: item['Period'],
                    stockno: item['Stock No'],
                    inv_item: item['Inv Item'],
                    unitcost: item['Unit Cost'],
                    countunit: item['Unit'],
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemStatusSuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    period: item['Period'],
                    stockno: item['Stock No'],
                    inv_item: item['Inv Item'],
                    unitcost: item['Unit Cost'],
                    countunit: item['Unit'],
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemerror.push(prmitem)
                rescheck = false
            }
        }
        //Add Log Audit StatusSuccess     
        for (let item of itemStatusSuccess) {
            const new_value = {
                period: item['period'],
                stockno: item['stockno'],
                inv_item: item['inv_item'],
                unitcost: item['unitcost'],
                countunit: item['countunit'],
                update_date: item.update_date,
                update_by: item.update_by,
            }
            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusSuccess,
                    audit_msg: MSGEditUploadSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }

        //Add Log Audit Error
        for (let item of itemerror) {
            const new_value = {
                period: item['period'],
                stockno: item['stockno'],
                inv_item: item['inv_item'],
                unitcost: item['unitcost'],
                countunit: item['countunit'],
                update_date: item.update_date,
                update_by: item.update_by,
            }

            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGEditUploadUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: item.original_value,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }


        //Respone StatusSuccess
        if (rescheck == true) {
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
        } else { //Respone Error
            const data = {
                "status": StatusUnComplate,
                "message": `UnitCost ${itemerror.map((item) => { return `Period: ${item['period']} , InvItem: ${item['inv_item']}` })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetValidationInvItem(req, res, reqBody) {   
    try {       
        let result = await ServiceGetValidationInvItemUnitCost()        
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(result.recordset));
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
}

async function GenInveotory(req, res, reqBody, authData) {
    if (reqBody.period == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const period = reqBody.period.toString().trim()
    const screen_id = reqBody.screen_id.trim()


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
        const prm = {
            period: period,
        }

        let result = await ServiceGenUnitCost(prm)
        if (result !== undefined) {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: ActionCallProcedures,
                status: StatusSuccess,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGProcedures_GEN_IVENTORY_TO_E1,
                browser: browser
            }

            // Add Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

            let GenInventory = ''

            for (let item of result) {
                let GenInventoryitem = ''
                GenInventoryitem = (item.AccountMode.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.AccountMode, GenInventoryitem].join("|")
                GenInventoryitem = (item.Company.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.Company, GenInventoryitem].join("|")
                GenInventoryitem = (item.CurrencyCode.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.CurrencyCode, GenInventoryitem].join("|")
                GenInventoryitem = (item.Mode.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.Mode, GenInventoryitem].join("|")
                GenInventoryitem = (item.LedgerType.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.LedgerType, GenInventoryitem].join("|")
                GenInventoryitem = (item.Explanation.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.Explanation, GenInventoryitem].join("|")
                GenInventoryitem = (item.GLDate.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.GLDate, GenInventoryitem].join("|")
                GenInventoryitem = (item.SubLedger.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.SubLedger, GenInventoryitem].join("|")
                GenInventoryitem = (item.SubLedgerType.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.SubLedgerType, GenInventoryitem].join("|")
                GenInventoryitem = (item.Amount.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.Amount, GenInventoryitem].join("|")
                GenInventoryitem = (item.AccountCode.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.AccountCode, GenInventoryitem].join("|")
                GenInventoryitem = (item.Remark.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.Remark, GenInventoryitem].join("|")
                GenInventoryitem = (item.LineNo.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.LineNo, GenInventoryitem].join("|")
                GenInventoryitem = (item.DocCom.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.DocCom, GenInventoryitem].join("|")
                GenInventoryitem = (item.DocType.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.DocType, GenInventoryitem].join("|")
                GenInventoryitem = (item.DocNo.trim() == '') ? [' ', GenInventoryitem].join("|") : [item.DocNo, GenInventoryitem].join("|")
                GenInventory += `${GenInventoryitem}\r\n`
            }

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=GLINV_PH.txt');

            res.send(GenInventory);

        } else {
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: ActionCallProcedures,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGProcedures_GEN_IVENTORY_TO_E1,
                browser: browser
            }

            // Add Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

            let GenInventory = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=GLSALES_PH.txt');

            res.send(GenInventory);
        }

    } catch (err) {
        res.sendStatus(500)
    }
}