import { connect, NVarChar, close } from 'mssql'; // MS Sql Server client
import { dbConfig } from '../../../settings';

export {
    ServiceGetMessageByCode,
    ServiceResponseMsg
}

async function ServiceGetMessageByCode(prmCode, prmMsg) {
    let Msg = ''
    try {
        const querysql = 'SELECT MSG_DESC_EN \
                            ,MSG_DESC_TH \
                            ,MSG_TYPE \
                    FROM MESSAGE WHERE MSG_CODE = @input_MSG_CODE'
        // input parameter            
        const input_MSG_CODE = 'input_MSG_CODE'
        //    
        let pool = await connect(dbConfig)
        let result = await pool.request()
            // set parameter
            .input(input_MSG_CODE, NVarChar, prmCode.trim())
            .query(querysql)
        
        if (result.rowsAffected > 0) {
            if (typeof prmMsg !== 'undefined') {
                if (Object.keys(prmMsg).length > 0) {
                    Msg = result.recordset[0].MSG_DESC_TH
                    let count = 0
                    for (let index in prmMsg) {    // don't actually do this
                        Msg = Msg.replace('{' + count + '}', prmMsg[index])
                        count++
                    }
                }
            } else {
                Msg = result.recordset[0].MSG_DESC_TH
            }

        }
    } catch (err) {
        //400 Bad Request
    } finally {
        await close()
    }

    return await Msg
}

async function ServiceResponseMsg(res, prmMsg) {    
    if (prmMsg.status == null) throw new Error("Input not valid")
    
    if (typeof prmMsg.Msg !== 'undefined') {
        if (Object.keys(prmMsg.Msg).length > 0) {
            if (prmMsg.Msg == null) throw new Error("Input not valid")

            const data = {
                "status": prmMsg.status,
                "message": prmMsg.Msg,
            }           
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        }
    }

    if (typeof prmMsg.Code !== 'undefined') {
        //check message code
        if (Object.keys(prmMsg.Code).length > 0) {
            if (prmMsg.Code == null) throw new Error("Input not valid")

            const data = {
                "status": prmMsg.status,
                "message": await ServiceGetMessageByCode(prmMsg.Code, prmMsg.prmMsg),
            }
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        }
    }
}
