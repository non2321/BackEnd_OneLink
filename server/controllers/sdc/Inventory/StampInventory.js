import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log';
import { ServiceCountStampInventory, ServiceAddStampInventory, ServiceSearchTempStampInventory, ServiceEditStampInventory } from '../../../models/Services/Inventory';
import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';

import { ActionAdd, ActionEdit } from '../../../models/action_type';
import { StatusSuccess, StatusError, StatusUnComplate, StatusComplate } from '../../../models/status_type';
import { MSGAddSuccess, MSGAddUnSuccess, CodeE0002, CodeS0004, MSGEditSuccess, CodeS0005, MSGEditUnSuccess, CodeE0003 } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings';

export { AddStampInventory };

async function AddStampInventory(req, res, reqBody, authData) {
    if (reqBody.stamp == null) throw new Error("Input not valid")
    if (reqBody.post_date_type == null) throw new Error("Input not valid")
    if (reqBody.datefrom == null) throw new Error("Input not valid")
    if (reqBody.dateto == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const stamp = reqBody.stamp.trim()
    const post_date_type = reqBody.post_date_type.trim()
    const datefrom = reqBody.datefrom.trim()
    const dateto = reqBody.dateto.trim()
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
        const prmcount = {
            datefrom: datefrom,
            dateto: dateto,
            post_date_type: post_date_type
        }

        if (stamp == 'option1') {
            const StampCount = await ServiceCountStampInventory(prmcount)          
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

            if (StampCount.rowsAffected > 0) {
                
                if (AuditTrail.uid) {
                    //Add Log Audit
                    const tempdata = {
                        tabel_name: post_date_type,
                        owner: authData.id,
                        start_date: datefrom,
                        end_date: dateto,
                        create_date: datetime,
                        create_by: authData.id,
                        status: 'A'
                    }
                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: ActionAdd,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusError,
                        audit_msg: MSGAddUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: tempdata,
                        original_value: '',
                    }
                    await ServiceInsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                const messageAlert = await ServiceGetMessageByCode(CodeE0002)
                const data = {
                    "status": StatusUnComplate,
                    "message": messageAlert,
                }
                await res.setHeader('Content-Type', 'application/json');
                await res.send(JSON.stringify(data));

            } else {
                const prm = {
                    post_date_type: post_date_type,
                    owner: authData.id,
                    datefrom: datefrom,
                    dateto: dateto,
                    post_date_type: post_date_type,
                    create_date: datetime,
                    create_by: authData.id
                }

                const result = await ServiceAddStampInventory(prm)
                if (result !== undefined) { //Insert Success  

                    if (AuditTrail.uid) {
                        //Add Log Audit
                        const tempdata = {
                            tabel_name: post_date_type,
                            owner: authData.id,
                            start_date: datefrom,
                            end_date: dateto,
                            create_date: datetime,
                            create_by: authData.id,
                            status: 'A'
                        }
                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: ActionAdd,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: StatusSuccess,
                            audit_msg: MSGAddSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
                            original_value: '',
                        }
                        await ServiceInsertLogAudit(prmLogAudit)
                    }

                    //Get Message Alert.
                    let messageAlert = await ServiceGetMessageByCode(CodeS0004)

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
                        const tempdata = {
                            tabel_name: post_date_type,
                            owner: authData.id,
                            start_date: datefrom,
                            end_date: dateto,
                            create_date: datetime,
                            create_by: authData.id,
                            status: 'A'
                        }

                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: ActionAdd,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: StatusError,
                            audit_msg: MSGAddUnSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
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
            }
        } else if (stamp == 'option2') {
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

            const prm = {
                owner: authData.id,
                datefrom: datefrom,
                post_date_type: post_date_type,
                dateto: dateto,
                update_date: datetime,
                update_by: authData.id
            }
            let temp = await ServiceSearchTempStampInventory(prm)

            const StampCount = await ServiceCountStampInventory(prmcount)
            if (StampCount.rowsAffected > 0) {

                const result = await ServiceEditStampInventory(prm)
                if (result !== undefined) { //Edit Success                                       
                    if (AuditTrail.uid) {
                        //Add Log Audit  
                        const tempdata = {
                            tabel_name: post_date_type,
                            start_date: datefrom,
                            end_date: dateto,
                            update_date: datetime,
                            update_by: authData.id,
                            status: 'I'
                        }

                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: ActionEdit,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: StatusSuccess,
                            audit_msg: MSGEditSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
                            original_value: temp.recordset,
                        }
                        await ServiceInsertLogAudit(prmLogAudit)
                    }

                    //Get Message Alert.
                    let messageAlert = await ServiceGetMessageByCode(CodeS0005)

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
                        const tempdata = {
                            tabel_name: post_date_type,
                            start_date: datefrom,
                            end_date: dateto,
                            update_date: datetime,
                            update_by: authData.id,
                            status: 'I'
                        }

                        const prmLogAudit = {
                            audit_date: datetime,
                            action_type: ActionEdit,
                            user_id: authData.id,
                            screen_name: screen_name,
                            client_ip: req.ip,
                            status: StatusError,
                            audit_msg: MSGEditUnSuccess,
                            audit_trail_id: AuditTrail.uid,
                            new_value: tempdata,
                            original_value: temp.recordset,
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
            } else {
                if (AuditTrail.uid) {
                    //Add Log Audit  
                    const tempdata = {
                        tabel_name: post_date_type,
                        start_date: datefrom,
                        end_date: dateto,
                        update_date: datetime,
                        update_by: authData.id,
                        status: 'I'
                    }

                    const prmLogAudit = {
                        audit_date: datetime,
                        action_type: ActionEdit,
                        user_id: authData.id,
                        screen_name: screen_name,
                        client_ip: req.ip,
                        status: StatusError,
                        audit_msg: MSGEditUnSuccess,
                        audit_trail_id: AuditTrail.uid,
                        new_value: tempdata,
                        original_value: temp.recordset,
                    }
                    await ServiceInsertLogAudit(prmLogAudit)
                }

                //Get Message Alert.
                const messageAlert = await ServiceGetMessageByCode(CodeE0003)
                const data = {
                    "status": StatusUnComplate,
                    "message": messageAlert,
                }
                await res.setHeader('Content-Type', 'application/json');
                await res.send(JSON.stringify(data));
            }
        }

    } catch (err) {
        res.sendStatus(500)
    }
}