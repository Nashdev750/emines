const { job, sendRewards } = require("./job");
const mongoose = require('mongoose');
const { getRandomFutureDate } = require("./utils");


mongoose.connect(``)
.then(async ()=>{
    console.log('connected')
    // job()
    // sendRewards()
    await getRandomFutureDate()
})