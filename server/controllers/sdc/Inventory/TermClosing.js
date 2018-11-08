import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceGetTermClosing, ServiceCheckDuplicateTermClosing, ServiceCheckPeriodsTermClosing, ServiceGetTermClosingForInsert, ServiceInsertTermClosing, ServiceGetTermClosingById, ServiceEditTermClosing } from '../../../models/Services/Inventory';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionAdd, ActionEdit } from '../../../models/action_type';
import { StatusSuccess, StatusComplate, StatusError, StatusUnComplate } from '../../../models/status_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, CodeE0008, MSGAddDuplicate, CodeE0007, MSGEditSuccess, MSGEditUnSuccess, CodeS0002 } from '../../../models/msg_type';
import { GetCountACC_TERM_CLOSING } from '../../../models/Services/utils';

import { secretkey, tokenexpires } from '../../../../settings';

export {
    GetDataTableTermClosing,
    AddTermClosing,
    EditTermClosing
}


async function GetDataTableTermClosing(req, res, reqBody) {
    try {
        const result = await ServiceGetTermClosing()

        const rowdata = {
            "aaData": result.recordset
        }
        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(rowdata));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function AddTermClosing(req, res, reqBody, authData) {
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
        const screen = await ServiceGetScreenById(screen_id)

        if (Object.keys(screen).length > 0) {
            screen_name = screen.SCREEN_NAME
            module_name = screen.MODULE
        }

        const prmchk = {
            year: year,
        }
        const dupdata = await ServiceCheckDuplicateTermClosing(prmchk)

        //Set object prm
        const prm = {
            year: year,
            create_date: datetime,
            create_by: authData.id
        }

        if (dupdata) {
            //Check Periods
            const checkPeriods = await ServiceCheckPeriodsTermClosing(prm)
            if (checkPeriods) {
                let result = await ServiceGetTermClosingForInsert(prm)
                for (let item of result) {
                    const prmInsert = {
                        term_id: await GetCountACC_TERM_CLOSING(),
                        period_id: item['PERIOD_ID'],
                        pb_date: item['PB_DATE'],
                        pe_date: item['PE_DATE'],
                        create_date: prm.create_date,
                        create_by: prm.create_by
                    }
                    await ServiceInsertTermClosing(prmInsert)
                }
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

                //Get Message Alert.
                const messageAlert = await ServiceGetMessageByCode(CodeE0008)
                const data = {
                    "status": StatusUnComplate,
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

            //Get Message Alert.
            const messageAlert = await ServiceGetMessageByCode(CodeE0007)
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

async function EditTermClosing(req, res, obj, authData) {
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
            const tempdata = await ServiceGetTermClosingById(item.term_id)
            const prm = {
                term_id: item.term_id,
                pb_date: item.pb_date,
                pe_date: item.pe_date,
                update_date: datetime,
                update_by: authData.id
            }
            const res = await ServiceEditTermClosing(prm)
            if (res != undefined) {
                const prmitem = {
                    term_id: item.term_id,
                    pb_date: item.pb_date,
                    pe_date: item.pe_date,
                    update_date: datetime,
                    update_by: authData.id,
                    original_value: tempdata.recordset
                }
                itemStatusSuccess.push(prmitem)
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

        //Add Log Audit StatusSuccess     
        for (let item of itemStatusSuccess) {
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
                term_id: item.term_id,
                pb_date: item.pb_date,
                pe_date: item.pe_date,
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
                "message": `Term Closing ${itemerror.map((item) => { return item['term_id'] })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}