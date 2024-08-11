const { job, sendRewards } = require("./job");
const mongoose = require('mongoose');
const { getRandomFutureDate } = require("./utils");
const { getReaderBoard } = require("./botFunctions");


mongoose.connect(``)
.then(async ()=>{
    console.log('connected')
    getReaderBoard()
})