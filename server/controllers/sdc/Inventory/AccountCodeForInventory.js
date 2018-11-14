import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceGetAccountCodeForInventory, ServiceGetDropDownGrpBy, ServiceGetDropDownCatCode, ServiceGetDropDownAccType, ServiceCheckDuplicateAccountCodeForInventory, ServiceInsertAccountCodeForInventory, ServiceGetTempAccountCodeForInventory, ServiceEditAccountCodeForInventory, ServiceGetValidationAccountCodeForInventory } from '../../../models/Services/Inventory';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionAdd, ActionEdit, ActionAddUpload } from '../../../models/action_type';
import { StatusSuccess, StatusComplate, StatusError, StatusUnComplate } from '../../../models/status_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, MSGAddDuplicate, CodeE0005, MSGEditSuccess, MSGAddUploadSuccess, MSGAddUploadUnSuccess, CodeS0002, MSGEditUnSuccess } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings';

export {
    GetAccountCodeForInventory,
    GetDropDownGrpBy,
    GetDropDownCatCode,
    GetDropDownAccType,
    AddAccountCodeForInventory,
    EditAccountCodeForInventory,
    ImportAccountCodeForInventory,
    GetValidationAccountCodeForInventory
}

async function GetAccountCodeForInventory(req, res, reqBody) {
    try {
        let result = await ServiceGetAccountCodeForInventory()
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
        let result = await ServiceGetDropDownGrpBy()

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
        let result = await ServiceGetDropDownCatCode()

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
        let result = await ServiceGetDropDownAccType()

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

async function AddAccountCodeForInventory(req, res, reqBody, authData) {
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
            action_code: action_code,
            inv_class: inv_class,
            acc_type: acc_type
        }
        let dupdata = await ServiceCheckDuplicateAccountCodeForInventory(prmchk)

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
            let result = await ServiceInsertAccountCodeForInventory(prm)

            if (result !== undefined) { //Insert Success            
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
                }

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
            } else {  //Insert UnSuccess
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
                    const prmLogAudit = {
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
                    await ServiceInsertLogAudit(prmLogAudit)
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

            ////////////////////// Alert Message JSON //////////////////////             
            const prmMsg = {
                action_code: prm.action_code,
                inv_class: prm.inv_class,
                acc_type: prm.acc_type
            }
            //Get Message Alert.
            const messageAlert = await ServiceGetMessageByCode(CodeE0005, prmMsg)
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

async function EditAccountCodeForInventory(req, res, reqBody, authData) {
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
        const datetime = new Date().toLocaleString().replace(',', '')
        //Browser
        const browser = JSON.stringify(browserdetect(req.headers['user-agent']))

        //Get Screen name && Module name
        const screen = await ServiceGetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }        

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

        const tempdata = await ServiceGetTempAccountCodeForInventory(prm)

        let result = await ServiceEditAccountCodeForInventory(prm)

        if (result !== undefined) { //Edit Success            
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
            if (AuditTrail.uid) {
                //Add Log Audit         
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusSuccess,
                    audit_msg: MSGEditSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prm,
                    original_value: tempdata.recordset,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }

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
        } else {  //Edit UnSuccess
            const prmLog = {
                audit_trail_date: datetime,
                module: module_name,
                screen_name: screen_name,
                action_type: ActionEdit,
                status: StatusError,
                user_id: authData.id,
                client_ip: req.ip,
                msg: MSGEditUnSuccess,
                browser: browser
            }
            // Add Log.
            let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
            if (AuditTrail.uid) {
                //Add Log Audit         
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGEditUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: prm,
                    original_value: tempdata.recordset,
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }

            ////////////////////// Alert Message JSON ////////////////////// 

            const data = {
                "status": StatusUnComplate,
                "message": "ไม่สามารถบันทึกข้อมูลลงในระบบได้",
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }

    } catch (err) {
        res.sendStatus(500)
    }
}

async function ImportAccountCodeForInventory(req, res, obj, authData) {
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
            action_type: ActionAddUpload,
            status: StatusSuccess,
            user_id: authData.id,
            client_ip: req.ip,
            msg: MSGAddUploadSuccess,
            browser: browser
        }

        // Add Log.
        let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

        let rescheck = true
        let itemStatusSuccess = []
        let itemerror = []

        for (let item of obj) {            
            const prm = {
                action_code: item['Action Code'],
                inv_class: item['Inv Class'],
                action: item['Action'],
                obj_account: item['Obj Account'],
                subsidary: item['Subsidary'],
                grp_by: item['GrpBy'],
                cat_code: item['CatCode'],
                acc_type: item['Acc Type'],
                doc_no: item['Doc No'],
                remark: item['Remark'],
                create_date: datetime,
                create_by: authData.id
            }
           
            let res = await ServiceInsertAccountCodeForInventory(prm)            

            if (res != undefined) {
                const prmitem = {
                    action_code: item['Action Code'],
                    inv_class: item['Inv Class'],
                    action: item['Action'],
                    obj_account: item['Obj Account'],
                    subsidary: item['Subsidary'],
                    grp_by: item['GrpBy'],
                    cat_code: item['CatCode'],
                    acc_type: item['Acc Type'],
                    doc_no: item['Doc No'],
                    remark: item['Remark'],
                    create_date: datetime,
                    create_by: authData.id,
                    original_value: ''
                }
                itemStatusSuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    action_code: item['Action Code'],
                    inv_class: item['Inv Class'],
                    action: item['Action'],
                    obj_account: item['Obj Account'],
                    subsidary: item['Subsidary'],
                    grp_by: item['GrpBy'],
                    cat_code: item['CatCode'],
                    acc_type: item['Acc Type'],
                    doc_no: item['Doc No'],
                    remark: item['Remark'],
                    create_date: datetime,
                    create_by: authData.id,
                    original_value: ''
                }
                itemerror.push(prmitem)
                rescheck = false
            }
        }
        //Add Log Audit StatusSuccess     
        for (let item of itemStatusSuccess) {
            const new_value = {
                action_code: item['action_code'],
                inv_class: item['inv_class'],
                action: item['action'],
                obj_account: item['obj_account'],
                subsidary: item['subsidary'],
                grp_by: item['grp_by'],
                cat_code: item['cat_code'],
                acc_type: item['acc_type'],
                doc_no: item['doc_no'],
                remark: item['remark'],
                create_date: item.create_date,
                create_by: item.create_by,
            }
            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionAdd,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusSuccess,
                    audit_msg: MSGAddUploadSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: '',
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }

        //Add Log Audit Error
        for (let item of itemerror) {
            const new_value = {
                action_code: item['action_code'],
                inv_class: item['inv_class'],
                action: item['action'],
                obj_account: item['obj_account'],
                subsidary: item['subsidary'],
                grp_by: item['grp_by'],
                cat_code: item['cat_code'],
                acc_type: item['acc_type'],
                doc_no: item['doc_no'],
                remark: item['remark'],
                create_date: item.create_date,
                create_by: item.create_by,
            }

            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionAdd,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGAddUploadUnSuccess,
                    audit_trail_id: AuditTrail.uid,
                    new_value: new_value,
                    original_value: '',
                }
                await ServiceInsertLogAudit(prmLogAudit)
            }
        }


        //Respone StatusSuccess
        if (rescheck == true) {
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
        } else { //Respone Error
            const data = {
                "status": StatusUnComplate,
                "message": `AccountCode For Inventory ${itemerror.map((item) => { return `Action Code: ${item['action_code']} , Inv Class: ${item['inv_class']} , Acc Type: ${item['acc_type']}` })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetValidationAccountCodeForInventory(req, res, reqBody) {   
    try {       
        let result = await ServiceGetValidationAccountCodeForInventory()        
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(result.recordset));
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
}

