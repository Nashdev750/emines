require('dotenv').config();
const mongoose = require('mongoose');
const pk = ''
const { DBCONNECTION } = require('./constants/db');
const { User, WalletTracker } = require('./models/models');

mongoose.connect(DBCONNECTION)
.then(async ()=>{
    const tras = await WalletTracker.find().lean()
    for (let i = 0; i < tras.length; i++) {
        const t = JSON.parse(tras[i].activity)[0];
        
        if(t.source.toLowerCase().includes("raydium")) console.log(t.source)
        if(!t.source.toLowerCase().includes("raydium")) await WalletTracker.findByIdAndDelete({_id:tras[i]._id})

        
    }
    console.log('done')
})