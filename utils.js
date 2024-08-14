const { Bot, User, Log } = require("./models/models");
const { getTokenBalance } = require("./solana");
const { format } = require('date-fns');


const logActivity = async (chatId,activity="default")=>{
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const newDate = format(new Date(currentDate), 'MM-dd-yyyy')
    await Log.create({
        telegramid:chatId,
        activity,
        newDate
    })
}

async function getRandomFutureDate() {
    // Generate a random number of days between 30 and 60
    const bot = await Bot.findOne()
    const randomDays = Math.floor(Math.random() * (bot.grantRangeMax - bot.grantRangeMin + 1)) + bot.grantRangeMin;
   
    // Get the current date
    const currentDate = new Date();

    // Add the random number of days to the current date
    currentDate.setDate(currentDate.getDate() + randomDays);
    currentDate.setHours(0, 0, 0, 0);
    const newDate = format(new Date(currentDate), 'MM-dd-yyyy')
    return newDate;
}

const updateWalletBalance = async (chatId,firsttime=false)=>{
    try {
        const user = await User.findOne({telegramid: chatId}).lean()
        if(!user?._id) return
        const bal = await getTokenBalance(user.address)
        await User.findByIdAndUpdate({_id:user._id},{walletbalance:bal})
        if(firsttime || !user.initailupdate) await User.findByIdAndUpdate({_id:user._id},{startbalance:bal,initailupdate:true})
        return bal
    } catch (error) {
        
    }

}

module.exports = { getRandomFutureDate, updateWalletBalance, logActivity}
