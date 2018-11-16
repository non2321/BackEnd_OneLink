import { connect, close, NVarChar } from 'mssql'; // MS Sql Server client

import { dbConfig } from '../../../settings';
import { Lov_ID } from '../digit_number';
import { FormatNumberLength, GetCountLOVId } from '../../models/Services/utils';

export {
    ServiceGetCompanyConfig,
    ServiceGetLovById,
    ServiceInsertLov,
    ServiceEditLov,
    ServiceDeleteLovById,
    ServiceCheckDuplicate,
    ServiceCheckEditDuplicate,

    ServiceGetCompanyAccountConfig
}

async function ServiceGetCompanyConfig() {
    let res = {}
    try {  
        let querysql = `SELECT LOV_ID,
                            LOV1, 
                            LOV2 
                    FROM   LOV_DATA 
                    WHERE  LOV_GROUP = 'SDC' 
                            AND LOV_TYPE = 'SALES' 
                            AND LOV_CODE = 'COMPANY' 
                            AND ACTIVE_FLAG = 'A' 
                            ORDER BY LOV1 ASC ` 

        let pool = await connect(dbConfig)      
        let result = await pool.request().query(querysql)           
        res = result

    } catch (err) {

    } finally {
        await close()
    }

    return await res

}

async function ServiceGetLovById(Id) {
    let res = {}
    try {  
        let querysql = `SELECT lov_id, 
                            lov_group, 
                            lov_type, 
                            parent_lov_id, 
                            lov_code, 
                            lov1, 
                            lov2, 
                            lov3, 
                            lov4, 
                            lov5, 
                            lov6, 
                            lov7, 
                            lov8, 
                            lov9, 
                            lov10, 
                            lov_desc, 
                            lov_desc, 
                            lov_order, 
                            active_flag, 
                            Format(create_date, 'MM/dd/yyyy hh:mm:ss:mmm tt') AS CREATE_DATE, 
                            create_by, 
                            Format(update_date, 'MM/dd/yyyy hh:mm:ss:mmm tt') AS UPDATE_DATE, 
                            update_by 
                    FROM   lov_data 
                    WHERE  LOV_ID = @input_lov_id ` 
        const input_lov_id = 'input_lov_id'
        let pool = await connect(dbConfig)      
        let result = await pool.request().input(input_lov_id, NVarChar, Id.trim()).query(querysql) 
        if (result !== undefined) {
            if (result.rowsAffected > 0) res = result
        }  

    } catch (err) {

    } finally {
        await close()
    }

    return await res
}

async function ServiceInsertLov(prmlov) {
    let res
    try {
        let lovid = FormatNumberLength(await GetCountLOVId(), Lov_ID)
        if (lovid) {
            const querysql = `INSERT INTO LOV_DATA
            (LOV_ID, 
            LOV_GROUP,
            LOV_TYPE,
            PARENT_LOV_ID,
            LOV_CODE, 
            LOV1, 
            LOV2, 
            LOV3, 
            LOV4, 
            LOV5, 
            LOV6, 
            LOV7, 
            LOV8, 
            LOV9, 
            LOV10, 
            LOV_DESC, 
            LOV_ORDER,
            ACTIVE_FLAG, 
            CREATE_DATE, 
            CREATE_BY) 
    VALUES      (@input_lov_id, 
            @input_lov_group, 
            @input_lov_type, 
            @input_parent_lov_id,
            @input_lov_code,  
            @input_lov_1, 
            @input_lov_2, 
            @input_lov_3, 
            @input_lov_4, 
            @input_lov_5, 
            @input_lov_6, 
            @input_lov_7, 
            @input_lov_8, 
            @input_lov_9, 
            @input_lov_10, 
            @input_lov_desc, 
            @input_lov_order,
            @input_active_flage,
            @input_create_date,
            @input_create_by ); `

            const input_lov_id = 'input_lov_id'
            const input_lov_group = 'input_lov_group'
            const input_lov_type = 'input_lov_type'
            const input_parent_lov_id = 'input_parent_lov_id'
            const input_lov_code = 'input_lov_code'
            const input_lov_1 = 'input_lov_1'
            const input_lov_2 = 'input_lov_2'
            const input_lov_3 = 'input_lov_3'
            const input_lov_4 = 'input_lov_4'
            const input_lov_5 = 'input_lov_5'
            const input_lov_6 = 'input_lov_6'
            const input_lov_7 = 'input_lov_7'
            const input_lov_8 = 'input_lov_8'
            const input_lov_9 = 'input_lov_9'
            const input_lov_10 = 'input_lov_10'
            const input_lov_desc = 'input_lov_desc'
            const input_lov_order = 'input_lov_order'
            const input_active_flage = 'input_active_flage'
            const input_create_date = 'input_create_date'
            const input_create_by = 'input_create_by'

            let pool = await connect(dbConfig)
            let result = await pool.request()
                .input(input_lov_id, NVarChar, lovid.trim())
                .input(input_lov_group, NVarChar, (prmlov.lov_group != undefined) ? prmlov.lov_group.trim() : '')
                .input(input_lov_type, NVarChar, (prmlov.lov_type != undefined) ? prmlov.lov_type.trim() : '')
                .input(input_parent_lov_id, NVarChar, (prmlov.parent_lov_id != undefined) ? prmlov.parent_lov_id : '')
                .input(input_lov_code, NVarChar, (prmlov.lov_code != undefined) ? prmlov.lov_code.trim() : '')
                .input(input_lov_1, NVarChar, (prmlov.lov_1 != undefined) ? prmlov.lov_1.trim() : '')
                .input(input_lov_2, NVarChar, (prmlov.lov_2 != undefined) ? prmlov.lov_2.trim() : '')
                .input(input_lov_3, NVarChar, (prmlov.lov_3 != undefined) ? prmlov.lov_3.trim() : '')
                .input(input_lov_4, NVarChar, (prmlov.lov_4 != undefined) ? prmlov.lov_4.trim() : '')
                .input(input_lov_5, NVarChar, (prmlov.lov_5 != undefined) ? prmlov.lov_5.trim() : '')
                .input(input_lov_6, NVarChar, (prmlov.lov_6 != undefined) ? prmlov.lov_6.trim() : '')
                .input(input_lov_7, NVarChar, (prmlov.lov_7 != undefined) ? prmlov.lov_7.trim() : '')
                .input(input_lov_8, NVarChar, (prmlov.lov_8 != undefined) ? prmlov.lov_8.trim() : '')
                .input(input_lov_9, NVarChar, (prmlov.lov_9 != undefined) ? prmlov.lov_9.trim() : '')
                .input(input_lov_10, NVarChar, (prmlov.lov_10 != undefined) ? prmlov.lov_10.trim() : '')
                .input(input_lov_desc, NVarChar, (prmlov.lov_desc != undefined) ? prmlov.lov_desc.trim() : '')
                .input(input_lov_order, NVarChar, (prmlov.lov_order != undefined) ? prmlov.lov_order.trim() : '')
                .input(input_active_flage, NVarChar, (prmlov.active_flage != undefined) ? prmlov.active_flage.trim() : '')
                .input(input_create_date, NVarChar, (prmlov.create_date != undefined) ? prmlov.create_date.trim() : '')
                .input(input_create_by, NVarChar, (prmlov.create_by != undefined) ? prmlov.create_by.trim() : '')
                .query(querysql)
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        await close()
    }

    return await res

}

async function ServiceEditLov(prmlov) {
    let res
    try {    
        if (prmlov.lov_id) {          
            let querysql = `UPDATE LOV_DATA SET LOV_ID=LOV_ID `    
            // var newStr = ["str1", "str2"].join(","); 
            if (prmlov.lov_group != undefined) querysql =  [querysql ,`LOV_GROUP = @input_lov_group `].join(",")
            if (prmlov.lov_type != undefined) querysql =  [querysql ,`LOV_TYPE = @input_lov_type `].join(",")
            if (prmlov.parent_lov_id != undefined) querysql =  [querysql ,`PARENT_LOV_ID = @input_parent_lov_id `].join(",")
            if (prmlov.lov_code != undefined) querysql =  [querysql ,`LOV_CODE = @input_lov_code `].join(",")
            if (prmlov.lov_1 != undefined) querysql =  [querysql ,`LOV1 = @input_lov_1 `].join(",")
            if (prmlov.lov_2 != undefined) querysql =  [querysql ,`LOV2 = @input_lov_2 `].join(",")
            if (prmlov.lov_3 != undefined) querysql =  [querysql ,`LOV3 = @input_lov_3 `].join(",")
            if (prmlov.lov_4 != undefined) querysql =  [querysql ,`LOV4 = @input_lov_4 `].join(",")
            if (prmlov.lov_5 != undefined) querysql =  [querysql ,`LOV5 = @input_lov_5 `].join(",")
            if (prmlov.lov_6 != undefined) querysql =  [querysql ,`LOV6 = @input_lov_6 `].join(",")
            if (prmlov.lov_7 != undefined) querysql =  [querysql ,`LOV7 = @input_lov_7 `].join(",")
            if (prmlov.lov_8 != undefined) querysql =  [querysql ,`LOV8 = @input_lov_8 `].join(",")
            if (prmlov.lov_9 != undefined) querysql =  [querysql ,`LOV9 = @input_lov_9 `].join(",")
            if (prmlov.lov_10 != undefined) querysql =  [querysql ,`LOV10 = @input_lov_10 `].join(",")
            if (prmlov.lov_desc != undefined) querysql =  [querysql ,`LOV_DESC = @input_lov_desc `].join(",")
            if (prmlov.lov_order != undefined) querysql =  [querysql ,`LOV_ORDER = @input_lov_order `].join(",")
            if (prmlov.active_flage != undefined) querysql =  [querysql ,`ACTIVE_FLAG = @input_active_flage `].join(",")  
            
            if (prmlov.update_date != undefined) querysql =  [querysql ,`UPDATE_DATE = @input_update_date `].join(",") 
            if (prmlov.update_by != undefined) querysql =  [querysql ,`UPDATE_BY = @input_update_by `].join(",") 

            querysql += ` WHERE LOV_ID = @input_lov_id `

            const input_lov_id = 'input_lov_id'
            const input_lov_group = 'input_lov_group'
            const input_lov_type = 'input_lov_type'
            const input_parent_lov_id = 'input_parent_lov_id'
            const input_lov_code = 'input_lov_code'
            const input_lov_1 = 'input_lov_1'
            const input_lov_2 = 'input_lov_2'
            const input_lov_3 = 'input_lov_3'
            const input_lov_4 = 'input_lov_4'
            const input_lov_5 = 'input_lov_5'
            const input_lov_6 = 'input_lov_6'
            const input_lov_7 = 'input_lov_7'
            const input_lov_8 = 'input_lov_8'
            const input_lov_9 = 'input_lov_9'
            const input_lov_10 = 'input_lov_10'
            const input_lov_desc = 'input_lov_desc'
            const input_lov_order = 'input_lov_order'
            const input_active_flage = 'input_active_flage'
            const input_update_date = 'input_update_date'
            const input_update_by = 'input_update_by'
           

            let pool = await connect(dbConfig)
            let result = await pool.request()
            if(prmlov.lov_id != undefined) await result.input(input_lov_id, NVarChar, prmlov.lov_id.trim())
            if(prmlov.lov_group != undefined) await result.input(input_lov_group, NVarChar, prmlov.lov_group.trim())
            if(prmlov.lov_type != undefined) await result.input(input_lov_type, NVarChar, prmlov.lov_type.trim())
            if(prmlov.parent_lov_id != undefined) await result.input(input_parent_lov_id, NVarChar, prmlov.parent_lov_id.trim())
            if(prmlov.lov_code != undefined) await result.input(input_lov_code, NVarChar, prmlov.lov_code.trim())
            if(prmlov.lov_1 != undefined) await result.input(input_lov_1, NVarChar, prmlov.lov_1.trim())
            if(prmlov.lov_2 != undefined) await result.input(input_lov_2, NVarChar, prmlov.lov_2.trim())
            if(prmlov.lov_3 != undefined) await result.input(input_lov_3, NVarChar, prmlov.lov_3.trim())
            if(prmlov.lov_4 != undefined) await result.input(input_lov_4, NVarChar, prmlov.lov_4.trim())
            if(prmlov.lov_5 != undefined) await result.input(input_lov_5, NVarChar, prmlov.lov_5.trim())
            if(prmlov.lov_6 != undefined) await result.input(input_lov_6, NVarChar, prmlov.lov_6.trim())
            if(prmlov.lov_7 != undefined) await result.input(input_lov_7, NVarChar, prmlov.lov_7.trim())
            if(prmlov.lov_8 != undefined) await result.input(input_lov_8, NVarChar, prmlov.lov_8.trim())
            if(prmlov.lov_9 != undefined) await result.input(input_lov_9, NVarChar, prmlov.lov_9.trim())
            if(prmlov.lov_10 != undefined) await result.input(input_lov_10, NVarChar, prmlov.lov_10.trim())
            if(prmlov.lov_desc != undefined) await result.input(input_lov_desc, NVarChar, prmlov.lov_desc.trim())
            if(prmlov.lov_order != undefined) await result.input(input_lov_order, NVarChar, prmlov.lov_order.trim())
            if(prmlov.active_flage != undefined) await result.input(input_active_flage, NVarChar, prmlov.active_flage.trim()) 
            
            if(prmlov.update_date != undefined) await result.input(input_update_date, NVarChar, prmlov.update_date.trim())   
            if(prmlov.update_by != undefined) await result.input(input_update_by, NVarChar, prmlov.update_by.trim())   
            result = await result.query(querysql)            
            
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        await close()
    }

    return await res

}

async function ServiceDeleteLovById(id) {
    let res
    try {    
        if (id) {          
            let querysql = `DELETE LOV_DATA
            WHERE  LOV_ID = @input_lov_id `   
           
            const input_lov_id = 'input_lov_id'  

            let pool = await connect(dbConfig)
            let result = await pool.request()
            .input(input_lov_id, NVarChar, id.trim())           
            .query(querysql)            
            
            if (result !== undefined) {
                if (result.rowsAffected > 0) res = true
            }
        }
    } catch (err) {

    } finally {
        await close()
    }

    return await res

}

async function ServiceCheckDuplicate(prmlov) {
    let res = true
    try {  
        let querysql = `SELECT LOV1,LOV2 FROM   LOV_DATA WHERE 1=1 `                              
        if (prmlov.lov_id != undefined) querysql += `AND LOV_ID = @input_lov_id `
        if (prmlov.lov_group != undefined) querysql += `AND LOV_GROUP = @input_lov_group `
        if (prmlov.lov_type != undefined) querysql += `AND LOV_TYPE = @input_lov_type `
        if (prmlov.lov_code != undefined) querysql += `AND LOV_CODE = @input_lov_code `
        if (prmlov.lov_1 != undefined) querysql += `AND LOV1 = @input_lov_1 `
        if (prmlov.lov_2 != undefined) querysql += `AND LOV2 = @input_lov_2 `
        if (prmlov.lov_3 != undefined) querysql += `AND LOV3 = @input_lov_3 `
        if (prmlov.lov_4 != undefined) querysql += `AND LOV4 = @input_lov_4 `
        if (prmlov.lov_5 != undefined) querysql += `AND LOV5 = @input_lov_5 `
        if (prmlov.lov_6 != undefined) querysql += `AND LOV6 = @input_lov_6 `
        if (prmlov.lov_7 != undefined) querysql += `AND LOV7 = @input_lov_7 `
        if (prmlov.lov_8 != undefined) querysql += `AND LOV8 = @input_lov_8 `
        if (prmlov.lov_9 != undefined) querysql += `AND LOV9 = @input_lov_9 `
        if (prmlov.lov_10 != undefined) querysql += `AND LOV10 = @input_lov_10 `
        if (prmlov.active_flage != undefined) querysql += `AND ACTIVE_FLAG  = @input_active_flage `       
      
        const input_lov_id = 'input_lov_id'
        const input_lov_group = 'input_lov_group'
        const input_lov_type = 'input_lov_type'
        const input_lov_code = 'input_lov_code'
        const input_lov_1 = 'input_lov_1'
        const input_lov_2 = 'input_lov_2'
        const input_lov_3 = 'input_lov_3'
        const input_lov_4 = 'input_lov_4'
        const input_lov_5 = 'input_lov_5'
        const input_lov_6 = 'input_lov_6'
        const input_lov_7 = 'input_lov_7'
        const input_lov_8 = 'input_lov_8'
        const input_lov_9 = 'input_lov_9'
        const input_lov_10 = 'input_lov_10'
        const input_active_flage = 'input_active_flage'
        
        let pool = await connect(dbConfig)
      
        let result = await pool.request()  

        if(prmlov.lov_id != undefined) await result.input(input_lov_id, NVarChar, prmlov.lov_id.trim())
        if(prmlov.lov_group != undefined) await result.input(input_lov_group, NVarChar, prmlov.lov_group.trim())
        if(prmlov.lov_type != undefined) await result.input(input_lov_type, NVarChar, prmlov.lov_type.trim())
        if(prmlov.lov_code != undefined) await result.input(input_lov_code, NVarChar, prmlov.lov_code.trim())
        if(prmlov.lov_1 != undefined) await result.input(input_lov_1, NVarChar, prmlov.lov_1.trim())
        if(prmlov.lov_2 != undefined) await result.input(input_lov_2, NVarChar, prmlov.lov_2.trim())
        if(prmlov.lov_3 != undefined) await result.input(input_lov_3, NVarChar, prmlov.lov_3.trim())
        if(prmlov.lov_4 != undefined) await result.input(input_lov_4, NVarChar, prmlov.lov_4.trim())
        if(prmlov.lov_5 != undefined) await result.input(input_lov_5, NVarChar, prmlov.lov_5.trim())
        if(prmlov.lov_6 != undefined) await result.input(input_lov_6, NVarChar, prmlov.lov_6.trim())
        if(prmlov.lov_7 != undefined) await result.input(input_lov_7, NVarChar, prmlov.lov_7.trim())
        if(prmlov.lov_8 != undefined) await result.input(input_lov_8, NVarChar, prmlov.lov_8.trim())
        if(prmlov.lov_9 != undefined) await result.input(input_lov_9, NVarChar, prmlov.lov_9.trim())
        if(prmlov.lov_10 != undefined) await result.input(input_lov_10, NVarChar, prmlov.lov_10.trim())
        if(prmlov.lov_order != undefined) await result.input(input_lov_order, NVarChar, prmlov.lov_order.trim())
        if(prmlov.active_flage != undefined) await result.input(input_active_flage, NVarChar, prmlov.active_flage.trim())
        result = await result.query(querysql)
           
        if (result !== undefined) {          
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        await close()
    }

    return await res

}

async function ServiceCheckEditDuplicate(prmlov) {
    let res = true
    try {  
        let querysql = `SELECT LOV1,LOV2 FROM   LOV_DATA WHERE 1=1 `                              
        if (prmlov.lov_id != undefined) querysql += `AND LOV_ID <> @input_lov_id `
        if (prmlov.lov_group != undefined) querysql += `AND LOV_GROUP = @input_lov_group `
        if (prmlov.lov_type != undefined) querysql += `AND LOV_TYPE = @input_lov_type `
        if (prmlov.lov_code != undefined) querysql += `AND LOV_CODE = @input_lov_code `
        if (prmlov.lov_1 != undefined) querysql += `AND LOV1 = @input_lov_1 `
        if (prmlov.lov_2 != undefined) querysql += `AND LOV2 = @input_lov_2 `
        if (prmlov.lov_3 != undefined) querysql += `AND LOV3 = @input_lov_3 `
        if (prmlov.lov_4 != undefined) querysql += `AND LOV4 = @input_lov_4 `
        if (prmlov.lov_5 != undefined) querysql += `AND LOV5 = @input_lov_5 `
        if (prmlov.lov_6 != undefined) querysql += `AND LOV6 = @input_lov_6 `
        if (prmlov.lov_7 != undefined) querysql += `AND LOV7 = @input_lov_7 `
        if (prmlov.lov_8 != undefined) querysql += `AND LOV8 = @input_lov_8 `
        if (prmlov.lov_9 != undefined) querysql += `AND LOV9 = @input_lov_9 `
        if (prmlov.lov_10 != undefined) querysql += `AND LOV10 = @input_lov_10 `
        if (prmlov.active_flage != undefined) querysql += `AND ACTIVE_FLAG  = @input_active_flage ` 
      
        const input_lov_id = 'input_lov_id'
        const input_lov_group = 'input_lov_group'
        const input_lov_type = 'input_lov_type'
        const input_lov_code = 'input_lov_code'
        const input_lov_1 = 'input_lov_1'
        const input_lov_2 = 'input_lov_2'
        const input_lov_3 = 'input_lov_3'
        const input_lov_4 = 'input_lov_4'
        const input_lov_5 = 'input_lov_5'
        const input_lov_6 = 'input_lov_6'
        const input_lov_7 = 'input_lov_7'
        const input_lov_8 = 'input_lov_8'
        const input_lov_9 = 'input_lov_9'
        const input_lov_10 = 'input_lov_10'
        const input_active_flage = 'input_active_flage'
        
        let pool = await connect(dbConfig)
      
        let result = await pool.request()  

        if(prmlov.lov_id != undefined) await result.input(input_lov_id, NVarChar, prmlov.lov_id.trim())
        if(prmlov.lov_group != undefined) await result.input(input_lov_group, NVarChar, prmlov.lov_group.trim())
        if(prmlov.lov_type != undefined) await result.input(input_lov_type, NVarChar, prmlov.lov_type.trim())
        if(prmlov.lov_code != undefined) await result.input(input_lov_code, NVarChar, prmlov.lov_code.trim())
        if(prmlov.lov_1 != undefined) await result.input(input_lov_1, NVarChar, prmlov.lov_1.trim())
        if(prmlov.lov_2 != undefined) await result.input(input_lov_2, NVarChar, prmlov.lov_2.trim())
        if(prmlov.lov_3 != undefined) await result.input(input_lov_3, NVarChar, prmlov.lov_3.trim())
        if(prmlov.lov_4 != undefined) await result.input(input_lov_4, NVarChar, prmlov.lov_4.trim())
        if(prmlov.lov_5 != undefined) await result.input(input_lov_5, NVarChar, prmlov.lov_5.trim())
        if(prmlov.lov_6 != undefined) await result.input(input_lov_6, NVarChar, prmlov.lov_6.trim())
        if(prmlov.lov_7 != undefined) await result.input(input_lov_7, NVarChar, prmlov.lov_7.trim())
        if(prmlov.lov_8 != undefined) await result.input(input_lov_8, NVarChar, prmlov.lov_8.trim())
        if(prmlov.lov_9 != undefined) await result.input(input_lov_9, NVarChar, prmlov.lov_9.trim())
        if(prmlov.lov_10 != undefined) await result.input(input_lov_10, NVarChar, prmlov.lov_10.trim())
        if(prmlov.lov_order != undefined) await result.input(input_lov_order, NVarChar, prmlov.lov_order.trim())
        if(prmlov.active_flage != undefined) await result.input(input_active_flage, NVarChar, prmlov.active_flage.trim())
        result = await result.query(querysql)
           
        if (result !== undefined) {          
            if (result.rowsAffected > 0) res = false
        }

    } catch (err) {

    } finally {
        await close()
    }

    return await res

}

////////////////////////  CompanyAccount  ////////////////////////
async function ServiceGetCompanyAccountConfig() {
    let res = {}
    try {  
        let querysql = `SELECT LOV_ID,
                            LOV1, 
                            LOV2,
                            LOV3 
                    FROM   LOV_DATA 
                    WHERE  LOV_GROUP = 'SDC' 
                            AND LOV_TYPE = 'SALES' 
                            AND LOV_CODE = 'COMPANY_ACC'  
                            AND ACTIVE_FLAG = 'A' 
                            ORDER BY LOV1 ASC ` 

        let pool = await connect(dbConfig)      
        let result = await pool.request().query(querysql)           
        res = result

    } catch (err) {

    } finally {
        await close()
    }

    return await res

}







