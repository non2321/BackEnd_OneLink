import fs from 'fs'
import { promisify } from 'util'
import unzipper from 'unzipper'
import Client from 'ssh2-sftp-client'
import delay from 'delay'
import JSZip from 'jszip'

import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../models/Services/Log';

import { ActionAdd, ActionEdit } from '../../models/action_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, CodeE0008, MSGAddDuplicate, CodeE0007, MSGEditSuccess, MSGEditUnSuccess, CodeS0002 } from '../../models/msg_type';
import { StatusSuccess, StatusComplate } from '../../models/status_type';

import { ServiceGetImpProcessById, ServiceGetFileTypeSDCInterfaceActive, ServiceInsertImpProcess, ServiceInsertImpData, ServiceInsertImpRow, ServiceGenInterFaceSql, ServiceGenInterFaceInvSql, ServiceCheckImpDataStatus, ServiceUpdateEndProcess, ServiceGetValidationsFile } from '../../models/Services/SDCInterface'
import { mmxsftp, tokenexpires, secretkey } from '../../../settings'

let sftp = new Client()

export {
    runTaskSDCInterface,
    GetDropDownSDCInterfaceFile,
    GetFileSDCInterfaceTypeActive,
    GetDataTableFileSDCInterfaceTypeActive,
    GetValidationFile,
    RerunTaskSDCInterface
};

async function runTaskSDCInterface() {
    const readdir = promisify(fs.readdir)
    const readFile = promisify(fs.readFile)
    try {
        // Current DateTime
        const datetime = new Date()
        let data_date
        await sftp.connect({
            host: mmxsftp.host,
            port: mmxsftp.port,
            username: mmxsftp.username,
            password: mmxsftp.password
        })
        let data = await sftp.list(mmxsftp.pathmmx)
        const dataday = ("0" + datetime.getDate()).slice(-2)
        const datamonth = ("0" + (datetime.getMonth() + 1)).slice(-2)

        if (data.length > 0) {
            const dir = mmxsftp.pathinterfacetemp
            let clearfile = await readdir(dir)
            for await (let file of clearfile) {
                //Delete All Files
                await fs.access(`${mmxsftp.pathinterfacetemp}/${file}`, error => {
                    if (!error) {
                        fs.unlinkSync(`${mmxsftp.pathinterfacetemp}/${file}`);
                    } else {
                        console.log(error);
                    }
                })
            }

            await delay(5000)
            for await (let item of data) {
                if (item.name == `${mmxsftp.filename.sdc}-${datetime.getFullYear()}-${datamonth}-${dataday}.${mmxsftp.filename.type}`
                    || item.name == `${mmxsftp.filename.pin}-${datetime.getFullYear()}-${datamonth}-${dataday}.${mmxsftp.filename.type}`) {
                    
                    const moveFrom = `${mmxsftp.pathmmx}/${item.name}`
                    const moveTo = `${mmxsftp.temppath}${item.name}`

                    const filename = item.name.replace('.zip', '')
                    const resfilename = filename.split('-')
                    let data_date_now = new Date(`${resfilename[1]}-${resfilename[2]}-${resfilename[3]}`)
                    data_date_now.setDate(data_date_now.getDate() - 1)
                    data_date = data_date_now

                    //Move file
                    await sftp.fastGet(moveFrom, moveTo)

                    //Extract zip file
                    await fs.createReadStream(`${mmxsftp.pathinterface}${item.name}`)
                        .pipe(unzipper.Extract({ path: mmxsftp.pathextractzip }))

                    //Delete zip file
                    await fs.unlink(`${mmxsftp.pathinterface}${item.name}`, (err) => {
                        if (err) throw err;
                        //console.log(`${item.name} was deleted`);
                    })
                }
            }

            await delay(5000)


            let filetypeActive = await ServiceGetFileTypeSDCInterfaceActive()
            let storename
            let count = 1
            let resImpProcess
            let filenames = await readdir(dir)

            let ObjectProcessID = []

            for await (let file of filenames) {
                //Check File Active.
                if (filetypeActive.find(x => x.file_type == file.substring(5, 8))) {
                    // Current DateTime
                    const datetimestart = new Date().toLocaleString().replace(',', '')

                    if (storename != file.substring(0, 5) || count == 1) {
                        const prmImpProcess = {
                            process_start: datetimestart,
                            process_end: datetimestart,
                            process_status: '',
                            message: '',
                            store: file.substring(0, 5),
                            data_date: `${data_date.getFullYear()}-${data_date.getMonth() + 1}-${data_date.getDate()}`
                        }
                        //Insert ImpProcess
                        resImpProcess = await ServiceInsertImpProcess(prmImpProcess)
                        ObjectProcessID.push(resImpProcess.uid)
                    }

                    if (resImpProcess.uid) {
                        const prmImpData = {
                            filetype_id: filetypeActive.find(x => x.file_type == file.substring(5, 8)).file_type_id,
                            filename: file,
                            impdata_start: datetimestart,
                            impdata_end: datetimestart,
                            impdata_status: 'S',
                            impdata_message: '',
                            process_id: resImpProcess.uid
                        }
                        const resImpData = await ServiceInsertImpData(prmImpData)
                        if (resImpData.uid) {
                            const tempfile = await readFile(`${mmxsftp.pathinterfacetemp}/${file}`)
                            const tempfiletostring = tempfile.toString('utf8')
                            const tempfilebyline = tempfiletostring.match(/[^\r\n]+/g)
                            if (tempfilebyline) {
                                for await (let temp of tempfilebyline) {
                                    let tempdata = temp.trim().split(',')
                                    //Check empty row
                                    if (tempdata.length > 1) {
                                        let prmImpRow = {}
                                        let colume = 1
                                        prmImpRow['data_id'] = resImpData.uid
                                        prmImpRow['row_status'] = ''
                                        prmImpRow['row_message'] = ''
                                        for await (let item of tempdata) {
                                            prmImpRow[`C${colume}`] = (item.length > 50) ? item.substring(0, 50) : item
                                            colume++
                                        }
                                        const resImpRow = await ServiceInsertImpRow(prmImpRow)
                                    }
                                }
                            }
                        }
                    }

                    storename = file.substring(0, 5)
                    count++
                }
            }

            await delay(5000)
            for await (let ProcessID of ObjectProcessID) {
                const prmprocessid = {
                    process_id: ProcessID
                }
                await ServiceGenInterFaceSql(prmprocessid)
                await ServiceGenInterFaceInvSql(prmprocessid)

                const resStatus = await ServiceCheckImpDataStatus(ProcessID)
                if (resStatus) {
                    const impprocess = await ServiceGetImpProcessById(ProcessID)
                    if (impprocess) {
                        const dataimpprocess = impprocess.recordset[0]
                        const datadate = impprocess.recordset[0].PROCESS_DATA_DATE
                        datadate.setDate(datadate.getDate() - 1)

                        const datayear = datadate.getFullYear()
                        const datamonth = ("0" + (datadate.getMonth() + 1)).slice(-2)
                        const dataday = ("0" + datadate.getDate()).slice(-2)


                        let status = true
                        for await (let itemdata of resStatus.recordset) {
                            if (itemdata.IMP_DATA_STATUS == 'F') {
                                status = false
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)
                                }

                                await fs.access(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, error => {
                                    if (!error) {
                                        fs.copyFileSync(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, `${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}/${itemdata.FILE_NAME}`)
                                    } else {
                                        console.log(error);
                                    }
                                })
                            } else {
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)
                                }
                                await fs.access(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, error => {
                                    if (!error) {
                                        fs.copyFileSync(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, `${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}/${itemdata.FILE_NAME}`)
                                    } else {
                                        console.log(error);
                                    }
                                })
                            }
                        }

                        if (status) {
                            // Current DateTime
                            const datetimeend = new Date().toLocaleString().replace(',', '')
                            const prmEndProcess = {
                                process_id: ProcessID,
                                process_end: datetimeend,
                                process_status: 'S'
                            }
                            await ServiceUpdateEndProcess(prmEndProcess)

                        } else {
                            // Current DateTime
                            const datetimeend = new Date().toLocaleString().replace(',', '')
                            const prmEndProcess = {
                                process_id: ProcessID,
                                process_end: datetimeend,
                                process_status: 'F'
                            }
                            await ServiceUpdateEndProcess(prmEndProcess)
                        }
                    }
                }
            }

            await delay(10000)
            let filedelete = await readdir(dir)
            for await (let file of filedelete) {
                //Delete All Files
                await fs.access(`${mmxsftp.pathinterfacetemp}/${file}`, error => {
                    if (!error) {
                        fs.unlinkSync(`${mmxsftp.pathinterfacetemp}/${file}`);
                    } else {
                        console.log(error);
                    }
                })
            }

        }
        await sftp.client.removeAllListeners()
        await sftp.end()

    } catch (err) {
    }
}

async function GetDropDownSDCInterfaceFile(req, res, reqBody) {
    try {
        let resdata = []
        await sftp.connect({
            host: mmxsftp.host,
            port: mmxsftp.port,
            username: mmxsftp.username,
            password: mmxsftp.password
        })
        let data = await sftp.list(mmxsftp.pathmmx)

        if (data.length > 0) {
            let resArray = []
            for await (let item of data) {
                const filename = item.name.replace('.zip', '')
                const resfilename = filename.split('-')
                const data_date = `${resfilename[1]}-${resfilename[2]}-${resfilename[3]}`
                resArray.push(data_date)
            }

            const distinctres = [...new Set(resArray)].sort().reverse()
            for await (let item of distinctres) {
                let resdate = new Date(item)
                resdate.setDate(resdate.getDate() - 1);
                resdata.push({ value: `${resdate.getFullYear()}-${resdate.getMonth() + 1}-${resdate.getDate()}` })
            }
        }
        await sftp.client.removeAllListeners()
        await sftp.end()
        await res.setHeader('Content-Type', 'application/json')
        await res.send(resdata)
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetFileSDCInterfaceTypeActive(req, res, reqBody) {
    try {
        let result = await ServiceGetFileTypeSDCInterfaceActive()

        let data = []
        for (let item of result) {
            data.push({ value: item.file_type, label: item.file_type })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetDataTableFileSDCInterfaceTypeActive(req, res, reqBody) {
    try {
        let result = await ServiceGetFileTypeSDCInterfaceActive()

        const rowdata = {
            "aaData": result
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(rowdata)
    } catch (err) {
        res.sendStatus(500)
    }
}

async function GetValidationFile(req, res, reqBody) {
    try {
        if (req.params.year == null) throw new Error("Input not valid")
        if (req.params.month == null) throw new Error("Input not valid")
        if (req.params.day == null) throw new Error("Input not valid")

        const year = req.params.year
        const month = req.params.month
        const day = req.params.day
        const store = req.params.store

        const msgfilenull = 'Disable the data'
        let dft = false, drt = false, dex = false, pin = false
        let msgdft = msgfilenull, msgdrt = msgfilenull, msgdex = msgfilenull, msgpin = msgfilenull

        const datetimeProcess = new Date(`${year}-${month}-${day}`)
        datetimeProcess.setDate(datetimeProcess.getDate() + 1)

        await sftp.connect({
            host: mmxsftp.host,
            port: mmxsftp.port,
            username: mmxsftp.username,
            password: mmxsftp.password
        })
        let data = await sftp.list(mmxsftp.pathmmx)
        const dataday = ("0" + datetimeProcess.getDate()).slice(-2)
        const datamonth = ("0" + (datetimeProcess.getMonth() + 1)).slice(-2)

        if (data.length > 0) {
            for await (let item of data) {
                if (item.name == `${mmxsftp.filename.sdc}-${datetimeProcess.getFullYear()}-${datamonth}-${dataday}.${mmxsftp.filename.type}`) {
                    dft = true
                    msgdft = ''
                    drt = true
                    msgdrt = ''
                    dex = true
                    msgdex = ''
                }
                if (item.name == `${mmxsftp.filename.pin}-${datetimeProcess.getFullYear()}-${datamonth}-${dataday}.${mmxsftp.filename.type}`) {

                    pin = true
                }
            }
        }
        await sftp.client.removeAllListeners()
        await sftp.end()

        const dataresult = {}
        if (dft) {
            msgdft = 'Already data'
            dft = false
            // Validation DailyFins
            const prm = {
                date: `${year}-${month}-${day}`,
                store: store
            }
            let result = await ServiceGetValidationsFile(prm)
            if (result) {
                dft = true
                msgdft = ''
            }
        }

        dataresult[`dft`] = {
            data: dft,
            msg: msgdft
        }
        dataresult[`drt`] = {
            data: drt,
            msg: msgdrt
        }
        dataresult[`dex`] = {
            data: dex,
            msg: msgdex
        }
        dataresult[`pin`] = {
            data: pin,
            msg: msgpin
        }

        await res.setHeader('Content-Type', 'application/json');
        await res.send(JSON.stringify(dataresult));
    } catch (err) {
        res.sendStatus(500)
    }
}

async function RerunTaskSDCInterface(req, res, reqBody, authData) {
    if (reqBody.file_type == null) throw new Error("Input not valid")
    if (reqBody.year == null) throw new Error("Input not valid")
    if (reqBody.month == null) throw new Error("Input not valid")
    if (reqBody.day == null) throw new Error("Input not valid")
    if (reqBody.screen_id == null) throw new Error("Input not valid")

    const file_type = reqBody.file_type
    const year = reqBody.year.toString().trim()
    const month = reqBody.month.toString().trim()
    const day = reqBody.day.toString().trim()
    const store = reqBody.store.toString().trim()
    const screen_id = reqBody.screen_id
    let screen_name = ''
    let module_name = ''

    const readdir = promisify(fs.readdir)
    const readFile = promisify(fs.readFile)

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
            msg: MSGAddSuccess,
            browser: browser
        }
        // Add Log.
        let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)

        // Current DateTime
        const datetimeProcess = new Date(`${year}-${month}-${day}`)
        datetimeProcess.setDate(datetimeProcess.getDate() + 1)
        let data_date
        await sftp.connect({
            host: mmxsftp.host,
            port: mmxsftp.port,
            username: mmxsftp.username,
            password: mmxsftp.password
        })
        let data = await sftp.list(mmxsftp.pathmmx)
        const dataday = ("0" + datetimeProcess.getDate()).slice(-2)
        const datamonth = ("0" + (datetimeProcess.getMonth() + 1)).slice(-2)      
        const datayear = datetimeProcess.getFullYear()        
        if (data.length > 0) {
            for await (let item of data) {  
                if (item.name == `${mmxsftp.filename.sdc}-${datayear}-${datamonth}-${dataday}.${mmxsftp.filename.type}`
                    || item.name == `${mmxsftp.filename.pin}-${datetimeProcess.getFullYear()}-${datamonth}-${dataday}.${mmxsftp.filename.type}`) {
                    const moveFrom = `${mmxsftp.pathmmx}/${item.name}`
                    const moveTo = `${mmxsftp.temppath}${item.name}`

                    const filename = item.name.replace('.zip', '')
                    const resfilename = filename.split('-')
                    let data_date_now = new Date(`${resfilename[1]}-${resfilename[2]}-${resfilename[3]}`)
                    data_date_now.setDate(data_date_now.getDate() - 1)
                    data_date = data_date_now

                    //Move file
                    await sftp.fastGet(moveFrom, moveTo)

                    //Extract zip file
                    await fs.createReadStream(`${mmxsftp.pathinterface}${item.name}`)
                        .pipe(unzipper.Extract({ path: mmxsftp.pathextractzip }))

                    //Delete zip file
                    await fs.unlink(`${mmxsftp.pathinterface}${item.name}`, async (err) => {
                        if (err) throw err;
                        // console.log(`${item.name} was deleted`);
                    })
                }
            }

            const dir = mmxsftp.pathinterfacetemp

            let filetypeActive = await ServiceGetFileTypeSDCInterfaceActive()
            let storename
            let count = 1
            let resImpProcess

            await delay(10000)
            let filedeletefisrt = await readdir(dir)
            for await (let file of filedeletefisrt) {
                if (!file_type.find(x => x.file_type == file.substring(5, 8))) {
                    //Delete All Files
                    await fs.access(`${mmxsftp.pathinterfacetemp}/${file}`, async error => {
                        if (!error) {
                            await fs.unlinkSync(`${mmxsftp.pathinterfacetemp}/${file}`);
                        } else {
                        }
                    })
                }
            }

            await delay(7000)

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
                    "message": '',
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


            let filenames = await readdir(dir)

            let ObjectProcessID = []

            for await (let file of filenames) {
                //Check File Active.
                if (filetypeActive.find(x => x.file_type == file.substring(5, 8))) {
                    //Check File Select
                    if (file_type.find(x => x.file_type == file.substring(5, 8))) {

                        //Select store
                        if (store) {
                            if (file.search(store) != -1) {
                                // Current DateTime
                                const datetimestart = new Date().toLocaleString().replace(',', '')

                                if (storename != file.substring(0, 5) || count == 1) {
                                    const prmImpProcess = {
                                        process_start: datetimestart,
                                        process_end: datetimestart,
                                        process_status: '',
                                        message: '',
                                        store: file.substring(0, 5),
                                        data_date: `${data_date.getFullYear()}-${data_date.getMonth() + 1}-${data_date.getDate()}`
                                    }
                                    //Insert ImpProcess
                                    resImpProcess = await ServiceInsertImpProcess(prmImpProcess)
                                    ObjectProcessID.push(resImpProcess.uid)
                                }
                                if (resImpProcess.uid) {
                                    const prmImpData = {
                                        filetype_id: filetypeActive.find(x => x.file_type == file.substring(5, 8)).file_type_id,
                                        filename: file,
                                        impdata_start: datetimestart,
                                        impdata_end: datetimestart,
                                        impdata_status: 'S',
                                        impdata_message: '',
                                        process_id: resImpProcess.uid
                                    }
                                    const resImpData = await ServiceInsertImpData(prmImpData)

                                    if (resImpData.uid) {
                                        const tempfile = await readFile(`${mmxsftp.pathinterfacetemp}/${file}`)
                                        const tempfiletostring = tempfile.toString('utf8')
                                        const tempfilebyline = tempfiletostring.match(/[^\r\n]+/g)
                                        if (tempfilebyline) {
                                            for (let temp of tempfilebyline) {
                                                let tempdata = temp.trim().split(',')
                                                //Check empty row
                                                if (tempdata.length > 1) {
                                                    let prmImpRow = {}
                                                    let colume = 1
                                                    prmImpRow['data_id'] = resImpData.uid
                                                    prmImpRow['row_status'] = ''
                                                    prmImpRow['row_message'] = ''
                                                    for (let item of tempdata) {
                                                        prmImpRow[`C${colume}`] = (item.length > 50) ? item.substring(0, 50) : item
                                                        colume++
                                                    }
                                                    const resImpRow = await ServiceInsertImpRow(prmImpRow)
                                                }
                                            }
                                        }
                                    }
                                }
                                storename = file.substring(0, 5)
                                count++
                            }
                        } else {

                            // Current DateTime
                            const datetimestart = new Date().toLocaleString().replace(',', '')

                            if (storename != file.substring(0, 5) || count == 1) {
                                const prmImpProcess = {
                                    process_start: datetimestart,
                                    process_end: datetimestart,
                                    process_status: '',
                                    message: '',
                                    store: file.substring(0, 5),
                                    data_date: `${data_date.getFullYear()}-${data_date.getMonth() + 1}-${data_date.getDate()}`
                                }
                                //Insert ImpProcess
                                resImpProcess = await ServiceInsertImpProcess(prmImpProcess)
                                ObjectProcessID.push(resImpProcess.uid)
                            }
                            if (resImpProcess.uid) {
                                const prmImpData = {
                                    filetype_id: filetypeActive.find(x => x.file_type == file.substring(5, 8)).file_type_id,
                                    filename: file,
                                    impdata_start: datetimestart,
                                    impdata_end: datetimestart,
                                    impdata_status: 'S',
                                    impdata_message: '',
                                    process_id: resImpProcess.uid
                                }
                                const resImpData = await ServiceInsertImpData(prmImpData)

                                if (resImpData.uid) {
                                    const tempfile = await readFile(`${mmxsftp.pathinterfacetemp}/${file}`)
                                    const tempfiletostring = tempfile.toString('utf8')
                                    const tempfilebyline = tempfiletostring.match(/[^\r\n]+/g)
                                    if (tempfilebyline) {
                                        for (let temp of tempfilebyline) {
                                            let tempdata = temp.trim().split(',')
                                            //Check empty row
                                            if (tempdata.length > 1) {
                                                let prmImpRow = {}
                                                let colume = 1
                                                prmImpRow['data_id'] = resImpData.uid
                                                prmImpRow['row_status'] = ''
                                                prmImpRow['row_message'] = ''
                                                for (let item of tempdata) {
                                                    prmImpRow[`C${colume}`] = (item.length > 50) ? item.substring(0, 50) : item
                                                    colume++
                                                }
                                                const resImpRow = await ServiceInsertImpRow(prmImpRow)
                                            }
                                        }
                                    }
                                }
                            }
                            storename = file.substring(0, 5)
                            count++
                        }

                    }
                }
            }

            await delay(5000)
            for (let ProcessID of ObjectProcessID) {
                const prmprocessid = {
                    process_id: ProcessID
                }
                await ServiceGenInterFaceSql(prmprocessid)
                await ServiceGenInterFaceInvSql(prmprocessid)
                const resStatus = await ServiceCheckImpDataStatus(ProcessID)
                if (resStatus) {
                    const impprocess = await ServiceGetImpProcessById(ProcessID)
                    if (impprocess) {
                        const dataimpprocess = impprocess.recordset[0]
                        const datadate = impprocess.recordset[0].PROCESS_DATA_DATE                        

                        const datayears = datadate.getFullYear()
                        const datamonths = ("0" + (datadate.getMonth() + 1)).slice(-2)
                        const datadays = ("0" + datadate.getDate()).slice(-2)                        

                        let status = true
                        for (let itemdata of resStatus.recordset) {
                            if (itemdata.IMP_DATA_STATUS == 'F') {
                                status = false
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayears}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayears}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayears}/${datamonths}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayears}/${datamonths}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayears}/${datamonths}/${datadays}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayears}/${datamonths}/${datadays}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayears}/${datamonths}/${datadays}/${dataimpprocess.PROCESS_STORE.trim()}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayears}/${datamonths}/${datadays}/${dataimpprocess.PROCESS_STORE.trim()}`)
                                }

                                await fs.access(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, error => {
                                    if (!error) {
                                        fs.copyFileSync(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, `${mmxsftp.pathinterfacefail}/${datayears}/${datamonths}/${datadays}/${dataimpprocess.PROCESS_STORE.trim()}/${itemdata.FILE_NAME}`)
                                    } else {
                                        console.log(error);
                                    }
                                })
                            } else {
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayears}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayears}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayears}/${datamonths}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayears}/${datamonths}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayears}/${datamonths}/${datadays}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayears}/${datamonths}/${datadays}`)
                                }
                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayears}/${datamonths}/${datadays}/${dataimpprocess.PROCESS_STORE.trim()}`)) {
                                    fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayears}/${datamonths}/${datadays}/${dataimpprocess.PROCESS_STORE.trim()}`)
                                }
                                await fs.access(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, error => {
                                    if (!error) {
                                        fs.copyFileSync(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, `${mmxsftp.pathinterfacesuccess}/${datayears}/${datamonths}/${datadays}/${dataimpprocess.PROCESS_STORE.trim()}/${itemdata.FILE_NAME}`)
                                    } else {
                                        console.log(error);
                                    }
                                })
                            }
                        }

                        if (status) {
                            // Current DateTime
                            const datetimeend = new Date().toLocaleString().replace(',', '')
                            const prmEndProcess = {
                                process_id: ProcessID,
                                process_end: datetimeend,
                                process_status: 'S'
                            }
                            await ServiceUpdateEndProcess(prmEndProcess)

                        } else {
                            // Current DateTime
                            const datetimeend = new Date().toLocaleString().replace(',', '')
                            const prmEndProcess = {
                                process_id: ProcessID,
                                process_end: datetimeend,
                                process_status: 'F'
                            }
                            await ServiceUpdateEndProcess(prmEndProcess)
                        }
                    }
                }
            }

            await delay(10000)
            let filedelete = await readdir(dir)
            for await (let file of filedelete) {
                //Delete All Files
                await fs.access(`${mmxsftp.pathinterfacetemp}/${file}`, async error => {
                    if (!error) {
                        await fs.unlinkSync(`${mmxsftp.pathinterfacetemp}/${file}`);
                    } else {
                    }
                })
            }

            await sftp.client.removeAllListeners()
            await sftp.end()

        }

    } catch (err) {
        res.sendStatus(500)
    }
}




