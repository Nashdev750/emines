const { Schema, model } = require("mongoose");

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
            type: String,
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
            type: Number,
            required: true,        
        },
        address:{
            type: Number,
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
        } ,
        investorPercentage:{
            type: Number,
            required: false, 
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
        Date:{
            type: String,
            required: true,        
        },

    }
);

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

module.exports = {User, Payout, Bot, TaskTrack, Task}