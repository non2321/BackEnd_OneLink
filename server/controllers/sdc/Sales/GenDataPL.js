import { sign } from 'jsonwebtoken'
import browserdetect from 'browser-detect';
import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../../models/Services/Log'
import { ServiceGetScreenById } from '../../../models/Services/Menu'
import { ServiceDeletePLBalE1, ServiceInsertPLBalE1, ServicePLBalE1_BALFile, ServicePLBalE1_BAL_ADJFile, ServicePLBalE1_ACTUALFile, ServicePLBalE1_ACTUAL_ADJFile, ServicePLBalE1_NetSalesFile, ServicePLBalE1_ACTUAL_SPA_AND__ACTUAL_ADJ_SPAFile } from '../../../models/Services/Financial'

import { ServiceGetMessageByCode } from '../../../models/Services/Messsage';
import { StatusSuccess, StatusError, StatusUnComplate, StatusComplate } from '../../../models/status_type'
import { ActionEdit, ActionAddUpload } from '../../../models/action_type'
import { CodeS0001, MSGAddUploadSuccess, MSGAddUploadUnSuccess } from '../../../models/msg_type';

import { secretkey, tokenexpires } from '../../../../settings';

export {
    GenDataFilePL,
    GenDataFilePL_BALFile,
    GenDataFilePL_BAL_ADJFile,
    GenDataFilePL_BAL_ACTUALFile,
    GenDataFilePL_BAL_ACTUAL_ADJFile,
    GenDataFilePL_BAL_NetSalesFile,
    GenDataFilePL_BAL_ACTUAL_SPA_AND__ACTUAL_ADJ_SPA   
}

async function GenDataFilePL(req, res, year, month, obj, authData) {    
    if (obj == null) throw new Error("Input not valid")
    if (year == null) throw new Error("Input not valid")
    if (month == null) throw new Error("Input not valid")
    if (req.body.screen_id == null) throw new Error("Input not valid")
    let screen_id = req.body.screen_id
    let screen_name = ''
    let module_name = ''
   
    try {        
        // Current DateTime
        const datetime = new Date().toLocaleString().replace(',', '')        
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

        const prmdel = {
            period_month: month,
            period_year: year
        }
        
        await ServiceDeletePLBalE1(prmdel)       
        for await (let item of obj) {
            const prm = {
                description: item['C1'].toString().trim(),
                e1acccode: item['C2'].toString().trim(),
                amount: item['C3'].toString().trim(),
                per_cent: item['C4'].toString().trim(),
                costcenter: item['C5'].toString().trim(),
                period_month: month,
                period_year: year,
                create_date: datetime,
                create_by: authData.id
            }

            const res = await ServiceInsertPLBalE1(prm)           
            if (res != undefined) {
                const prmitem = {
                    description: item['C1'].toString().trim(),
                    e1acccode: item['C2'].toString().trim(),
                    amount: item['C3'].toString().trim(),
                    per_cent: item['C4'].toString().trim(),
                    costcenter: item['C5'].toString().trim(),
                    period_month: month,
                    period_year: year,
                    create_date: datetime,
                    create_by: authData.id,
                    original_value: ''
                }                
                itemStatusSuccess.push(prmitem)
            }
            else if (res == undefined) {
                const prmitem = {
                    description: item['C1'].toString().trim(),
                    e1acccode: item['C2'].toString().trim(),
                    amount: item['C3'].toString().trim(),
                    per_cent: item['C4'].toString().trim(),
                    costcenter: item['C5'].toString().trim(),
                    period_month: month,
                    period_year: year,
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
                description: item.description,
                e1acccode: item.e1acccode,
                amount: item.amount,
                per_cent: item.per_cent,
                costcenter: item.costcenter,
                period_month: month,
                period_year: year,
                create_date: datetime,
                create_by: authData.id,
            }
            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusSuccess,
                    audit_msg: MSGAddUploadSuccess,
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
                description: item.description,
                e1acccode: item.e1acccode,
                amount: item.amount,
                per_cent: item.per_cent,
                costcenter: item.costcenter,
                period_month: month,
                period_year: year,
                create_date: datetime,
                create_by: authData.id,
            }

            if (AuditTrail.uid) {
                const prmLogAudit = {
                    audit_date: datetime,
                    action_type: ActionEdit,
                    user_id: authData.id,
                    screen_name: screen_name,
                    client_ip: req.ip,
                    status: StatusError,
                    audit_msg: MSGAddUploadUnSuccess,
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
                "message": `P&L ${itemerror.map((item) => { return `Description: ${item['description']} , E1AccCode: ${item['e1acccode']}` })} ไม่สามารถบันทึกข้อมูลลงในระบบได้`
            }
            await res.setHeader('Content-Type', 'application/json');
            await res.send(JSON.stringify(data));
        }
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GenDataFilePL_BALFile(req, res, reqBody, authData) {
    if (reqBody.period_month == null) throw new Error("Input not valid")
    if (reqBody.period_year == null) throw new Error("Input not valid")    
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const period_month = reqBody.period_month
    const period_year = reqBody.period_year 
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
            period_month: period_month,
            period_year: period_year           
        }

        let result = await ServicePLBalE1_BALFile(prm)
        if (result !== undefined) {           

            let PLBalE1 = ''           
            for (let item of result.recordsets[0]) { 
                let PLBalE1item = ''
                PLBalE1item = (item.acccode[1].toString().trim() == '') ? [' ', PLBalE1item].join("") : [item.acccode[1], PLBalE1item].join("")
                PLBalE1item = (item.e1acccode.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.e1acccode, PLBalE1item].join()
                PLBalE1item = (item.accone1.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.accone1, PLBalE1item].join("")
                PLBalE1item = (item.Per_cent.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Per_cent, PLBalE1item].join()
                PLBalE1item = (item.Amt.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Amt, PLBalE1item].join()
                PLBalE1item = (item.acccode[0].toString().trim() == '') ? [' ', PLBalE1item].join() : [item.acccode[0], PLBalE1item].join()
                PLBalE1item = (item.description.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.description, PLBalE1item].join()
                PLBalE1item = (item.CC.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.CC, PLBalE1item].join()
                PLBalE1 += `${PLBalE1item}\r\n`               
            } 
            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=BAL.txt');

            res.send(PLBalE1);

        } else {           

            let PLBalE1 = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=BAL.txt');

            res.send(PLBalE1);
        }

    } catch (err) {
        res.sendStatus(500)
    }

}

async function GenDataFilePL_BAL_ADJFile(req, res, reqBody, authData) {
    if (reqBody.period_month == null) throw new Error("Input not valid")
    if (reqBody.period_year == null) throw new Error("Input not valid")    
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const period_month = reqBody.period_month
    const period_year = reqBody.period_year
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
            period_month: period_month,
            period_year: period_year           
        }

        let result = await ServicePLBalE1_BAL_ADJFile(prm)
        if (result !== undefined) {           

            let PLBalE1 = ''

            for (let item of result.recordsets[0]) {                
                let PLBalE1item = ''
                PLBalE1item = (item.bal_adj.toString().trim() == '') ? [' ', PLBalE1item].join("") : [item.bal_adj, PLBalE1item].join("")
                PLBalE1item = (item.Per_cent.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Per_cent, PLBalE1item].join()               
                PLBalE1item = (item.Amt.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Amt, PLBalE1item].join()
                PLBalE1item = (item.acccode.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.acccode, PLBalE1item].join()
                PLBalE1item = (item.e1acccode.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.e1acccode, PLBalE1item].join()
                PLBalE1item = (item.description.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.description, PLBalE1item].join()
                PLBalE1item = (item.CC.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.CC, PLBalE1item].join()
                PLBalE1 += `${PLBalE1item}\r\n`
            }

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=BAL_ADJ.txt');

            res.send(PLBalE1);
        } else {           

            let PLBalE1 = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=BAL_ADJ.txt');

            res.send(PLBalE1);
        }

    } catch (err) {
        res.sendStatus(500)
    }

}

async function GenDataFilePL_BAL_ACTUALFile(req, res, reqBody, authData) {
    if (reqBody.period_month == null) throw new Error("Input not valid")
    if (reqBody.period_year == null) throw new Error("Input not valid")    
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const period_month = reqBody.period_month
    const period_year = reqBody.period_year 
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
            period_month: period_month,
            period_year: period_year           
        }

        let result = await ServicePLBalE1_ACTUALFile(prm)        
        if (result !== undefined) {           

            let PLBalE1 = ''

            for (let item of result.recordsets[0]) {
                let PLBalE1item = ''
                PLBalE1item = (item.actual.toString().trim() == '') ? [' ', PLBalE1item].join("") : [item.actual, PLBalE1item].join("")
                PLBalE1item = (item.Per_cent.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Per_cent, PLBalE1item].join()               
                PLBalE1item = (item.Amt.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Amt, PLBalE1item].join()
                PLBalE1item = (item.acccode.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.acccode, PLBalE1item].join()
                PLBalE1item = (item.e1acccode.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.e1acccode, PLBalE1item].join()
                PLBalE1item = (item.description.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.description, PLBalE1item].join()
                PLBalE1item = (item.CC.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.CC, PLBalE1item].join()
                PLBalE1 += `${PLBalE1item}\r\n`
            }

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=ACTUAL.txt');

            res.send(PLBalE1);

        } else {           

            let PLBalE1 = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=ACTUAL.txt');

            res.send(PLBalE1);           
        }

    } catch (err) {
        res.sendStatus(500)
    }

}

async function GenDataFilePL_BAL_ACTUAL_ADJFile(req, res, reqBody, authData) {
    if (reqBody.period_month == null) throw new Error("Input not valid")
    if (reqBody.period_year == null) throw new Error("Input not valid")    
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const period_month = reqBody.period_month
    const period_year = reqBody.period_year
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
            period_month: period_month,
            period_year: period_year           
        }

        let result = await ServicePLBalE1_ACTUAL_ADJFile(prm)
        if (result !== undefined) {           

            let PLBalE1 = ''

            for (let item of result.recordsets[0]) {
                let PLBalE1item = ''
                PLBalE1item = (item.actual_adj.toString().trim() == '') ? [' ', PLBalE1item].join("") : [item.actual_adj, PLBalE1item].join("")
                PLBalE1item = (item.Per_cent.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Per_cent, PLBalE1item].join()               
                PLBalE1item = (item.Amt.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Amt, PLBalE1item].join()
                PLBalE1item = (item.acccode.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.acccode, PLBalE1item].join()
                PLBalE1item = (item.e1acccode.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.e1acccode, PLBalE1item].join()
                PLBalE1item = (item.description.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.description, PLBalE1item].join()
                PLBalE1item = (item.CC.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.CC, PLBalE1item].join()
                PLBalE1 += `${PLBalE1item}\r\n`
            }

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=ACTUAL_ADJ.txt');

            res.send(PLBalE1);          

        } else {           

            let PLBalE1 = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=ACTUAL_ADJ.txt');

            res.send(PLBalE1);           
        }

    } catch (err) {
        res.sendStatus(500)
    }

}

async function GenDataFilePL_BAL_NetSalesFile(req, res, reqBody, authData) {
    if (reqBody.period_month == null) throw new Error("Input not valid")
    if (reqBody.period_year == null) throw new Error("Input not valid")    
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const period_month = reqBody.period_month
    const period_year = reqBody.period_year 
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
            period_month: period_month,
            period_year: period_year           
        }

        let result = await ServicePLBalE1_NetSalesFile(prm)
        if (result !== undefined) {           

            let PLBalE1 = ''

            for (let item of result.recordsets[0]) {
                let PLBalE1item = ''
                PLBalE1item = (item.netsales.toString().trim() == '') ? [' ', PLBalE1item].join("") : [item.netsales, PLBalE1item].join("")
                PLBalE1item = (item.CC.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.CC, PLBalE1item].join()               
                PLBalE1item = (item.Per_cent.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Per_cent, PLBalE1item].join()
                PLBalE1item = (item.Amt.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Amt, PLBalE1item].join()               
                PLBalE1item = (item.Description.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.Description, PLBalE1item].join()               
                PLBalE1 += `${PLBalE1item}\r\n`
            }

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=NetSales.txt');

            res.send(PLBalE1);           

        } else {           

            let PLBalE1 = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=NetSales.txt');

            res.send(PLBalE1);           
        }

    } catch (err) {
        res.sendStatus(500)
    }

}

async function GenDataFilePL_BAL_ACTUAL_SPA_AND__ACTUAL_ADJ_SPA(req, res, reqBody, authData) {
    if (reqBody.period_month == null) throw new Error("Input not valid")
    if (reqBody.period_year == null) throw new Error("Input not valid")    
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const period_month = reqBody.period_month
    const period_year = reqBody.period_year  
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
            period_month: period_month,
            period_year: period_year           
        }
       
        let result = await ServicePLBalE1_ACTUAL_SPA_AND__ACTUAL_ADJ_SPAFile(prm)
        if (result !== undefined) {           
            
            let PLBalE1_1 = '', PLBalE1_2 = ''

           
            for (let item of result.recordsets[0]) {               
                let PLBalE1item = ''
                PLBalE1item = (item.cc.toString().trim() == '') ? [' ', PLBalE1item].join("") : [item.cc, PLBalE1item].join("")
                PLBalE1item = (item.per_cent.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.per_cent, PLBalE1item].join()               
                PLBalE1item = (item.amt.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.amt, PLBalE1item].join()
                PLBalE1item = (item.description.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.description, PLBalE1item].join()
                PLBalE1_1 += `${PLBalE1item}\r\n`
            }  

            for (let item of result.recordsets[1]) {               
                let PLBalE1item = ''
                PLBalE1item = (item.cc.toString().trim() == '') ? [' ', PLBalE1item].join("") : [item.cc, PLBalE1item].join("")
                PLBalE1item = (item.per_cent.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.per_cent, PLBalE1item].join()               
                PLBalE1item = (item.amt.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.amt, PLBalE1item].join()
                PLBalE1item = (item.description.toString().trim() == '') ? [' ', PLBalE1item].join() : [item.description, PLBalE1item].join()
                PLBalE1_2 += `${PLBalE1item}\r\n`
            }        

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=ACTUAL_ADJ_SPA.txt');

            res.send({obj1:PLBalE1_1, obj2: PLBalE1_2});     
                 

        } else {           

            let PLBalE1_1 = '', PLBalE1_2 = ''

            res.setHeader('Content-type', "application/octet-stream");

            res.setHeader('Content-disposition', 'attachment; filename=ACTUAL_ADJ_SPA.txt');

            res.send({obj1:PLBalE1_1, obj2: PLBalE1_2});           
        }

    } catch (err) {
        res.sendStatus(500)
    }

}
