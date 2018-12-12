import fs from 'fs'
import { promisify } from 'util'
import unzipper from 'unzipper'
import Client from 'ssh2-sftp-client'

import { ServiceGetImpProcessById, ServiceGetFileTypeSDCInterfaceActive, ServiceInsertImpProcess, ServiceInsertImpData, ServiceInsertImpRow, ServiceGenInterFaceSql, ServiceGenInterFaceInvSql, ServiceCheckImpDataStatus, ServiceUpdateEndProcess } from '../../models/Services/SDCInterface'
import { mmxsftp } from '../../../settings'

let sftp = new Client()

export { runTaskSDCInterface };

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
                                            for (let item of tempdata) {
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
                        count++
                    }
                }
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

        await sftp.end()

    } catch (err) {
    }
}


