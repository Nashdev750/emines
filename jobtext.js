const { job, sendRewards } = require("./job");
const mongoose = require('mongoose');
const { getRandomFutureDate } = require("./utils");
const { getReaderBoard, saveUserData } = require("./botFunctions");
const { DBCONNECTION } = require("./constants/db");
const { TaskTrack } = require("./models/models");


mongoose.connect(DBCONNECTION)
.then(async ()=>{
    job()
})