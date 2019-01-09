import { sign } from 'jsonwebtoken'
import browserdetect from 'browser-detect'
import { ServiceGetScreenById } from '../../../models/Services/Menu'

import { ServiceGetNewInventoryItems, ServiceGetPopupVendorNewInventoryItems, ServiceCheckDuplicateNewInventoryItems, ServiceInventoryItemClassForNewInventoryItems, ServiceInsertNewInventoryItems } from '../../../models/Services/Inventory';
import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log'
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage'

import { ActionAdd } from '../../../models/action_type'
import { StatusSuccess, StatusComplate, StatusError, StatusUnComplate } from '../../../models/status_type'
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, MSGAddDuplicate, CodeE0005, MSGEditSuccess, MSGAddUploadSuccess, MSGAddUploadUnSuccess, CodeS0002, MSGEditUnSuccess, CodeE0004 } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings'

export {
    GetDataTableNewInventoryItems,
    GetPopupVendorNewInventoryItems,
    AddNewInventoryItems
}

async function GetDataTableNewInventoryItems(req, res, reqBody) {
    try {
        const result = await ServiceGetNewInventoryItems()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetPopupVendorNewInventoryItems(req, res, reqBody) {
    try {
        let result = await ServiceGetPopupVendorNewInventoryItems()
        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function AddNewInventoryItems(req, res, reqBody, authData) {    
    if (reqBody.stock_code == null) throw new Error("Input not valid")
    if (reqBody.description == null) throw new Error("Input not valid")
    if (reqBody.vendor == null) throw new Error("Input not valid")
    if (reqBody.costperinvoice == null) throw new Error("Input not valid")
    if (reqBody.unitm2 == null) throw new Error("Input not valid")
    if (reqBody.scalm2 == null) throw new Error("Input not valid")
    if (reqBody.costm2 == null) throw new Error("Input not valid")
    if (reqBody.unitm3 == null) throw new Error("Input not valid")
    if (reqBody.scalm3 == null) throw new Error("Input not valid")
    if (reqBody.costm3 == null) throw new Error("Input not valid")
    if (reqBody.unitm4 == null) throw new Error("Input not valid")
    if (reqBody.scalm4 == null) throw new Error("Input not valid")
    if (reqBody.costm4 == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const stock_code = reqBody.stock_code.trim()
    const description = reqBody.description.trim()
    const postinginterval = reqBody.postinginterval.trim()
    const vendor = reqBody.vendor
    const costperinvoice = reqBody.costperinvoice
    const unitm2 = reqBody.unitm2
    const scalm2 = reqBody.scalm2
    const costm2 = reqBody.costm2
    const unitm3 = reqBody.unitm3
    const scalm3 = reqBody.scalm3
    const costm3 = reqBody.costm3
    const unitm4 = reqBody.unitm4
    const scalm4 = reqBody.scalm4
    const costm4 = reqBody.costm4
    const screen_id = reqBody.screen_id

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
        const prmchk = {
            vendor: vendor,
            stock_code: stock_code
        }
        const dupdata = await ServiceCheckDuplicateNewInventoryItems(prmchk)

        //Set object prm
        let prm = {
            stock_code: stock_code,
            description: description,
            postinginterval: postinginterval,
            vendor: vendor,
            costperinvoice: costperinvoice,
            unitm2: unitm2,
            scalm2: scalm2,
            costm2: costm2,
            unitm3: unitm2,
            scalm3: scalm3,
            costm3: costm3,
            unitm4: unitm4,
            scalm4: scalm4,
            costm4: costm4,
            create_date: datetime,
            create_by: authData.id
        }

        if (dupdata) {
            const inventoryitemclass = await ServiceInventoryItemClassForNewInventoryItems(prm)
            prm['itemclass'] = inventoryitemclass.trim()            
            let result = await ServiceInsertNewInventoryItems(prm)
            if (result != undefined) {               
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
                
                // Add Log.
                let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
                if (AuditTrail.uid) {
                    //Add Log Audit         
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: ActionAdd,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusSuccess,
                        audit_msg: MSGAddSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prm,
                        original_value: '',
                    }
                    await ServiceInsertLogAudit(prmLogAudit)

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
                }
            } else {
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
                // Add Log.
                let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
                if (AuditTrail.uid) {
                    //Add Log Audit 
                    const prmLogAudit1 = {
                        audit_date: datetime,
                        action_type: ActionAdd,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusError,
                        audit_msg: MSGAddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: prm,
                        original_value: '',
                    }
                    await ServiceInsertLogAudit(prmLogAudit1)
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
                msg: MSGAddDuplicate,
                browser: browser
            }
            
            // Add Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)            
            if (AuditTrail.uid) {
                //Add Log Audit 
                const prmLogAudit1 = {
                    audit_date: datetime,
                    action_type: ActionAdd,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGAddDuplicate,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prm,
                    original_value: '',
                }                
                await ServiceInsertLogAudit(prmLogAudit1)
            }
            console.log(stock_code)
            console.log(vendor)
            ////////////////////// Alert Message JSON //////////////////////            
            const prmMsg = {
                stock_code: stock_code,
                vendor: vendor
            }
            console.log(prmMsg)
            //Get Message Alert.
            const messageAlert = await ServiceGetMessageByCode(CodeE0004, prmMsg)
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