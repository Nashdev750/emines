const { Schema, model } = require("mongoose");
const { DETAILSTEXT } = require("../constants/text");

const userSchema = new Schema(
    {
        telegramid:{
            type: Number,
            required: true, 
            unique: true        
        },
        telegramusername:{
            type: String,
            required: false      
        },
        parentid:{
            type: Number,
            required: false,
            default: 6046745325
        },
        balance:{
            type: Number,
            required: false,
            default: 0
        },
        walletbalance:{
            type: Number,
            required: false,
            default: 0
        },
        startbalance:{
            type: Number,
            required: false,
            default: 0
        },
        address: {
            type: String,
            required: false,
        },
        tweeter:{
            type: String,
            required: false,
            default: ""
        },
        nextgrant:{
            type: String,
            required: false,
            default: ""
        },
        initailupdate:{
            type: Boolean,
            required: false,
            default: false
        },
        totalReferrals: { type: Number, default: 0 }
    },
    {timestamps:true}
);
const payoutSchema = new Schema(
    {
        telegramid:{
            type: Number,
            required: true,        
        },
        telegramusername:{
            type: String,
            required: true,        
        },
        address:{
            type: String,
            required: true,        
        },
        amount:{
            type: Number,
            required: true,        
        },
      
        status:{
            type: Boolean,
            required: false,
            default: false        
        },
        error:{
            type: String,
            required: false,
            default: ""        
        },
      

    },
    {timestamps:true}
);

const botSchema = new Schema(
    {
        privatekey:{
            type: String,
            required: true,        
        },
        address:{
            type: String,
            required: true,        
        },
        captchaImagePath:{
            type: String,
            required: false, 
        },
        captchaText:{
            type: String,
            required: false, 
        },
        captchaAnswer:{
            type: String,
            required: false, 
        },
        fatherPercentage:{
            type: Number,
            required: false, 
            default:0.5
        } ,
        investorPercentage:{
            type: Number,
            required: false, 
            default: 0.5
        },
        fatherCoins:{
            type: Number,
            required: false, 
            default: 10
        } ,
        investorCoins:{
            type: Number,
            required: false, 
            default: 10
        },
        grantRangeMin:{
            type: Number,
            required: false, 
            default: 30
        },
        grantRangeMax:{
            type: Number,
            required: false, 
            default: 60
        },
        remindermessage:{
            type: String,
            required: false, 
        },
        reminderinterval:{
            type: Number,
            required: false, 
            default:86400000
        },
        detailstext:{
            type: String,
            required: false, 
            default:DETAILSTEXT
        }
    },
    {timestamps:true}
);

const TaskTrackSchema = new Schema(
    {
        question:{
            type: Number,
            required: true,        
        },
        userid:{
            type: Number,
            required: true,        
        },
        title:{
            type: String,
            required: false,
            default:""        
        },
        Date:{
            type: String,
            required: true,        
        },

    }
);


const channelSchema = new Schema({
    channelid: {
        type: Number,
        required: true,
        unique:true
    },
    title: {
        type: String,
        required: true,
        unique:true
    },
    message: {
        type: String,
        required: true
    }
});

const optionSchema = new Schema({
    text: {
        type: String,
        required: true
    }
});

const taskSchema = new Schema({
    question: {
        type: Number,
        required: true,
        unique:true
    },
    title: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: true
    },
    reward: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    options: {
        type: [optionSchema],
        required: false
    }
});

const Task = model('task', taskSchema);
const User = model('user',userSchema)
const Payout = model('payout',payoutSchema)
const Bot = model('bot',botSchema)
const TaskTrack = model('tasktrack',TaskTrackSchema)
const Channel = model('channel',channelSchema)

module.exports = {User, Payout, Bot, TaskTrack, Task, Channel}