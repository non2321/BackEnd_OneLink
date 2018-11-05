const DailyFins = require('../../models/Services/DailyFins')


module.exports.runTaskDailyFins = runTaskDailyFins

async function runTaskDailyFins() {
    try {
        // Current DateTime
        // const datetime = new Date().toLocaleString().replace(',', '')
        // let yesterday = new Date();
        // yesterday.setDate(yesterday.getDate() - 1);
        // console.log(yesterday.toLocaleDateString())

        // const prm = {
        //     fin_date: yesterday
        // }

        // DailyFins.DeleteDailyFinsByDate()

    } catch (err) {
        res.sendStatus(500)
    }
}