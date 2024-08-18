const { job, sendRewards } = require("./job");
const mongoose = require('mongoose');
const { getRandomFutureDate } = require("./utils");
const { getReaderBoard, saveUserData } = require("./botFunctions");
const { DBCONNECTION } = require("./constants/db");
const { TaskTrack } = require("./models/models");


mongoose.connect(DBCONNECTION)
.then(async ()=>{
    const today = new Date();
    const users = await TaskTrack.aggregate([
        {
            $lookup: {
                from: "users",           
                localField: "userid",    
                foreignField: "telegramid",     
                as: "userDetails"       
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                question: 1,
                Date: 1,
                "username": "$userDetails.telegramusername",
                "userid": 1
            }
        }
    ]);
    console.log(users)
})