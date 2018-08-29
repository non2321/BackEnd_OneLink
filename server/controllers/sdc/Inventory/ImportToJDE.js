const jwt = require('jsonwebtoken')
const browserdetect = require('browser-detect')
const menu = require('../../../models/Services/Menu')

const log = require('../../../models/Services/Log')
const Inventory = require('../../../models/Services/Inventory')
const message = require('../../../models/Services/Messsage')

const action_type = require('../../../models/action_type')
const status_type = require('../../../models/status_type')
const msg_type = require('../../../models/msg_type')

const settings = require('../../../../settings')

module.exports.GetDropDownPeriod = GetDropDownPeriod


async function GetDropDownPeriod(req, res, reqBody) {
    try {
        let result = await Inventory.GetDropDownPeriod()

        let data = []
        let items = result.recordset
        for (let item in items) {
            data.push({ value: items[item]['PERIOD_ID'], label: items[item]['Expr1'], year: items[item]['YEAR_ID'] })
        }

        await res.setHeader('Content-Type', 'application/json')
        await res.send(data)
    } catch (err) {
        res.sendStatus(500)
    }
}