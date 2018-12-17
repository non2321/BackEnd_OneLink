import fs from 'fs'
import { promisify } from 'util'
import unzipper from 'unzipper'
import Client from 'ssh2-sftp-client'
import delay from 'delay'

import { sign } from 'jsonwebtoken';
import browserdetect from 'browser-detect';
import { ServiceGetScreenById } from '../../models/Services/Menu';

import { ServiceInsertLogAuditTrail, ServiceInsertLogAudit } from '../../models/Services/Log';

import { ActionAdd, ActionEdit } from '../../models/action_type';
import { MSGAddSuccess, CodeS0001, MSGAddUnSuccess, CodeE0008, MSGAddDuplicate, CodeE0007, MSGEditSuccess, MSGEditUnSuccess, CodeS0002 } from '../../models/msg_type';
import { StatusSuccess, StatusComplate } from '../../models/status_type';

import { ServiceGetImpProcessById, ServiceGetFileTypeSDCInterfaceActive, ServiceInsertImpProcess, ServiceInsertImpData, ServiceInsertImpRow, ServiceGenInterFaceSql, ServiceGenInterFaceInvSql, ServiceCheckImpDataStatus, ServiceUpdateEndProcess } from '../../models/Services/SDCInterface'
import { mmxsftp, tokenexpires, secretkey } from '../../../settings'

let sftp = new Client()

export {
    runTaskSDCInterface,
    GetDropDownSDCInterfaceFile,
    GetFileSDCInterfaceTypeActive,
    GetDataTableFileSDCInterfaceTypeActive,
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

        if (data.length > 0) {
            for await (let item of data) {
                if (item.name == `${mmxsftp.filename.sdc}-${datetime.getFullYear()}-${datetime.getMonth() + 1}-${datetime.getDate()}.${mmxsftp.filename.type}`
                    || item.name == `${mmxsftp.filename.pin}-${datetime.getFullYear()}-${datetime.getMonth() + 1}-${datetime.getDate()}.${mmxsftp.filename.type}`) {

                    const moveFrom = `${mmxsftp.pathmmx}/${item.name}`
                    const moveTo = `${mmxsftp.temppath}${item.name}`

                    const filename = item.name.replace('.zip', '')
                    const resfilename = filename.split('-')
                    let data_date_now = new Date(`${resfilename[1]}-${resfilename[2]}-${resfilename[3]}`)
                    // data_date_now.setDate(data_date_now.getDate() - 1)
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
            const dir = mmxsftp.pathinterfacetemp

            await setTimeout(async () => {
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
                                                prmImpRow[`C${colume}`] = item
                                                colume++
                                            }
                                            const resImpRow = await ServiceInsertImpRow(prmImpRow)
                                            if (resImpRow.uid) {
                                            }
                                        }
                                    }
                                }
                            }

                            // if (resImpProcess.uid) {
                                
                            // }
                        }

                        storename = file.substring(0, 5)
                        count++
                    }
                }

                await delay(100)
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
                            const datayear = datadate.getFullYear()
                            const datamonth = datadate.getMonth() + 1
                            const dataday = datadate.getDate()

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


                await delay(2000)
                for await (let file of filenames) {
                    //Delete All Files
                    await fs.access(`${mmxsftp.pathinterfacetemp}/${file}`, error => {
                        if (!error) {
                            fs.unlinkSync(`${mmxsftp.pathinterfacetemp}/${file}`);
                        } else {
                            console.log(error);
                        }
                    })
                }
            }, 5000)
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

        const readdir = promisify(fs.readdir)
        const readFile = promisify(fs.readFile)


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
        if (data.length > 0) {
            for (let item of data) {
                if (item.name == `${mmxsftp.filename.sdc}-${datetimeProcess.getFullYear()}-${datetimeProcess.getMonth() + 1}-${datetimeProcess.getDate()}.${mmxsftp.filename.type}`
                    || item.name == `${mmxsftp.filename.pin}-${datetimeProcess.getFullYear()}-${datetimeProcess.getMonth() + 1}-${datetimeProcess.getDate()}.${mmxsftp.filename.type}`) {
                    const moveFrom = `${mmxsftp.pathmmx}/${item.name}`
                    const moveTo = `${mmxsftp.temppath}${item.name}`

                    const filename = item.name.replace('.zip', '')
                    const resfilename = filename.split('-')
                    let data_date_now = new Date(`${resfilename[1]}-${resfilename[2]}-${resfilename[3]}`)
                    data_date = data_date_now

                    //Move file
                    await sftp.fastGet(moveFrom, moveTo)

                    //Extract zip file
                    await fs.createReadStream(`${mmxsftp.pathinterface}${item.name}`)
                        .pipe(unzipper.Extract({ path: mmxsftp.pathextractzip }))

                    //Delete zip file
                    await fs.unlink(`${mmxsftp.pathinterface}${item.name}`, async (err) => {
                        if (err) throw err;
                        console.log(`${item.name} was deleted`);
                    })
                }
            }
            await delay(2000)
            const dir = mmxsftp.pathinterfacetemp
            let filetypeActive = await ServiceGetFileTypeSDCInterfaceActive()
            let storename
            let count = 1
            let resImpProcess
            let filenames = await readdir(dir)
            // for (let file of filenames) {
            //     //Check File Active.
            //     if (filetypeActive.find(x => x.file_type == file.substring(5, 8))) {
            //         //Check File Select
            //         if (file_type.find(x => x.file_type == file.substring(5, 8))) {
            //             // Current DateTime
            //             const datetimestart = new Date().toLocaleString().replace(',', '')
            //             if (storename != file.substring(0, 5) || count == 1) {
            //                 const prmImpProcess = {
            //                     process_start: datetimestart,
            //                     process_end: datetimestart,
            //                     process_status: '',
            //                     message: '',
            //                     store: file.substring(0, 5),
            //                     data_date: `${data_date.getFullYear()}-${data_date.getMonth() + 1}-${data_date.getDate()}`
            //                 }
            //             }

            //         }
            //     }
            // }
            for (let file of filenames) {
                console.log(file)
                //Check File Active.
                if (filetypeActive.find(x => x.file_type == file.substring(5, 8))) {
                    //Check File Select
                    if (file_type.find(x => x.file_type == file.substring(5, 8))) {
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
                                                prmImpRow[`C${colume}`] = item
                                                await colume++
                                            }
                                            const resImpRow = await ServiceInsertImpRow(prmImpRow)
                                            if (resImpRow.uid) {

                                            }
                                        }
                                    }
                                }
                            }

                            if (resImpProcess.uid) {
                                const prmprocessid = {
                                    process_id: resImpProcess.uid
                                }
                                await ServiceGenInterFaceSql(prmprocessid)
                                await ServiceGenInterFaceInvSql(prmprocessid)

                                const resStatus = await ServiceCheckImpDataStatus(resImpProcess.uid)
                                if (resStatus) {
                                    const impprocess = await ServiceGetImpProcessById(resImpProcess.uid)
                                    if (impprocess) {
                                        const dataimpprocess = impprocess.recordset[0]
                                        const datadate = impprocess.recordset[0].PROCESS_DATA_DATE
                                        const datayear = datadate.getFullYear()
                                        const datamonth = datadate.getMonth() + 1
                                        const dataday = datadate.getDate()

                                        let status = true
                                        for (let itemdata of resStatus.recordset) {
                                            if (itemdata.IMP_DATA_STATUS == 'F') {
                                                status = false
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacefail}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)
                                                }

                                                await fs.access(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, async error => {
                                                    if (!error) {
                                                        await fs.copyFileSync(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, `${mmxsftp.pathinterfacefail}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}/${itemdata.FILE_NAME}`)
                                                    } else {
                                                        console.log(error);
                                                    }
                                                })
                                            } else {
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}`)
                                                }
                                                if (!fs.existsSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)) {
                                                    await fs.mkdirSync(`${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}`)
                                                }
                                                await fs.access(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, async error => {
                                                    if (!error) {
                                                        await fs.copyFileSync(`${mmxsftp.pathinterfacetemp}/${itemdata.FILE_NAME}`, `${mmxsftp.pathinterfacesuccess}/${datayear}/${datamonth}/${dataday}/${dataimpprocess.PROCESS_STORE.trim()}/${itemdata.FILE_NAME}`)
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
                                                process_id: resImpProcess.uid,
                                                process_end: datetimeend,
                                                process_status: 'S'
                                            }
                                            await ServiceUpdateEndProcess(prmEndProcess)
                                        } else {
                                            // Current DateTime
                                            const datetimeend = new Date().toLocaleString().replace(',', '')
                                            const prmEndProcess = {
                                                process_id: resImpProcess.uid,
                                                process_end: datetimeend,
                                                process_status: 'F'
                                            }
                                            await ServiceUpdateEndProcess(prmEndProcess)
                                        }
                                    }
                                }
                            }
                        }

                        storename = file.substring(0, 5)
                        await count++
                    }
                }
            }
            // await delay(10000)
            // for (let file of filenames) {
            //     //Delete All Files
            //     await fs.access(`${mmxsftp.pathinterfacetemp}/${file}`, error => {
            //         if (!error) {
            //             console.log(`${file} was deleted`);
            //             fs.unlinkSync(`${mmxsftp.pathinterfacetemp}/${file}`);
            //         } else {
            //             console.log(error);
            //         }
            //     })
            // }

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

            await sftp.client.removeAllListeners()
            await sftp.end()

        }




        // //Set object prm
        // const prm = {
        //     year: year,
        //     create_date: datetime,
        //     create_by: authData.id
        // }

        // if (dupdata) {
        //     //Check Periods
        //     const checkPeriods = await ServiceCheckPeriodsTermClosing(prm)
        //     if (checkPeriods) {
        //         let result = await ServiceGetTermClosingForInsert(prm)
        //         for (let item of result) {
        //             const prmInsert = {
        //                 term_id: await GetCountACC_TERM_CLOSING(),
        //                 period_id: item['PERIOD_ID'],
        //                 pb_date: item['PB_DATE'],
        //                 pe_date: item['PE_DATE'],
        //                 create_date: prm.create_date,
        //                 create_by: prm.create_by
        //             }
        //             await ServiceInsertTermClosing(prmInsert)
        //         }

        //         if (AuditTrail.uid) {
        //             //Add Log Audit         
        //             const prmLogAudit = {
        //                 audit_date: datetime,
        //                 action_type: ActionAdd,
        //                 user_id: authData.id,
        //                 screen_name: screen_name,
        //                 client_ip: req.ip,
        //                 status: StatusSuccess,
        //                 audit_msg: MSGAddSuccess,
        //                 audit_trail_id: AuditTrail.uid,
        //                 new_value: prm,
        //                 original_value: '',
        //             }
        //             await ServiceInsertLogAudit(prmLogAudit)
        //         }
        //         //Get Message Alert.
        //         let messageAlert = await ServiceGetMessageByCode(CodeS0001)
        //         //Send JWT
        //         const jwtdata = {
        //             id: authData.id,
        //             firstname: authData.firstname,
        //             lastname: authData.lastname,
        //             position: authData.position,
        //             email: authData.email,
        //             mobile_no: authData.mobile_no,
        //             phc_user: authData.phc_user,
        //         }
        //         await sign({ jwtdata }, secretkey, { expiresIn: tokenexpires }, (err, token) => {
        //             res.json({
        //                 "status": StatusComplate,
        //                 "message": messageAlert,
        //                 "user": {
        //                     "id": authData.id,
        //                     "firstname": authData.firstname,
        //                     "lastname": authData.lastname,
        //                     "position": authData.position,
        //                     "email": authData.email,
        //                     "mobile_no": authData.mobile_no,
        //                     "phc_user": authData.phc_user,
        //                     token
        //                 }
        //             })
        //         })
        //     } else {
        //         const prmLog = {
        //             audit_trail_date: datetime,
        //             module: module_name,
        //             screen_name: screen_name,
        //             action_type: ActionAdd,
        //             status: StatusError,
        //             user_id: authData.id,
        //             client_ip: req.ip,
        //             msg: MSGAddUnSuccess,
        //             browser: browser
        //         }
        //         // Add Log.
        //         let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
        //         if (AuditTrail.uid) {
        //             //Add Log Audit 
        //             const prmLogAudit1 = {
        //                 audit_date: datetime,
        //                 action_type: ActionAdd,
        //                 user_id: authData.id,
        //                 screen_name: screen_name,
        //                 client_ip: req.ip,
        //                 status: StatusError,
        //                 audit_msg: MSGAddUnSuccess,
        //                 audit_trail_id: AuditTrail.uid,
        //                 new_value: prm,
        //                 original_value: '',
        //             }
        //             await ServiceInsertLogAudit(prmLogAudit1)
        //         }

        //         ////////////////////// Alert Message JSON //////////////////////            

        //         //Get Message Alert.
        //         const messageAlert = await ServiceGetMessageByCode(CodeE0008)
        //         const data = {
        //             "status": StatusUnComplate,
        //             "message": messageAlert,
        //         }
        //         await res.setHeader('Content-Type', 'application/json');
        //         await res.send(JSON.stringify(data));
        //     }

        // } else { //Duplicate Data        
        //     const prmLog = {
        //         audit_trail_date: datetime,
        //         module: module_name,
        //         screen_name: screen_name,
        //         action_type: ActionAdd,
        //         status: StatusError,
        //         user_id: authData.id,
        //         client_ip: req.ip,
        //         msg: MSGAddDuplicate,
        //         browser: browser
        //     }
        //     // Add Log.
        //     let AuditTrail = await ServiceInsertLogAuditTrail(prmLog)
        //     if (AuditTrail.uid) {
        //         //Add Log Audit 
        //         const prmLogAudit1 = {
        //             audit_date: datetime,
        //             action_type: ActionAdd,
        //             user_id: authData.id,
        //             screen_name: screen_name,
        //             client_ip: req.ip,
        //             status: StatusError,
        //             audit_msg: MSGAddDuplicate,
        //             audit_trail_id: AuditTrail.uid,
        //             new_value: prm,
        //             original_value: '',
        //         }
        //         await ServiceInsertLogAudit(prmLogAudit1)
        //     }

        //     ////////////////////// Alert Message JSON //////////////////////            

        //     //Get Message Alert.
        //     const messageAlert = await ServiceGetMessageByCode(CodeE0007)
        //     const data = {
        //         "status": StatusUnComplate,
        //         "message": messageAlert,
        //     }
        //     await res.setHeader('Content-Type', 'application/json');
        //     await res.send(JSON.stringify(data));
        // }
    } catch (err) {
        console.log(err)
        // res.sendStatus(500)
    }
}




