const { User, Payout, Bot } = require('./models/models');
const { transferToken } = require('./sendSPL');
const { getTokenBalance, sendToken } = require('./solana');
const { getRandomFutureDate } = require('./utils');

const sleep =(tm)=> new Promise((relv)=>{
    setTimeout(relv,tm)
})

const findUsersWithTodayGrant = async () => {
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0);
        const newDate = format(new Date(today), 'MM-dd-yyyy')
        const users = await User.find({ nextgrant: newDate }).lean();

        return users;
    } catch (error) {
        console.error('Error finding users with today\'s grant:', error);
        throw error;
    }
};

const job = async ()=>{
    console.log('---starting job---')
    try {
        const users = await findUsersWithTodayGrant()
        const bot = await Bot.findOne()
        const fp = bot.fatherPercentage/100
        const mp = bot.investorPercentage/100
        console.log('users=>',users.length)
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const decedants = await User.find({parentid: user.telegramid})
            let reward = 0
            for (let j = 0; j < decedants.length; j++) {
                const decedant = decedants[j];
                try {
                    const bal = await getTokenBalance(decedant.address) - decedant.startbalance
                    console.log('--sleep 10secs ---')
                    await sleep(10000)
                    console.log('decedant bal', bal)
                    if(bal > 0) reward += bal * fp
                } catch (error) {
                    console.log(error.message)
                }
                
            }
            try {
                const bal = await getTokenBalance(user.address) - user.startbalance
               if(bal > 0) reward += bal * mp
            } catch (error) {
                console.log(error.message)
            }
            try {
                await User.findOneAndUpdate({telegramid:user.telegramid},{balance: 0})
                reward += user.balance
            } catch (error) {
                console.log(error.message)
            }
            if(reward > 0){
                await Payout.create({
                    telegramid: user.telegramid,
                    address: user.address,
                    telegramusername: user.telegramusername,
                    amount: reward
                })
            }
            console.log("reward ---> ",reward)
        }
        // send tokens
        console.log('---send tokens--')
        await sendRewards()

    } catch (error) {
        console.log(error.message)
    }

}
const GetUserBalance = async (user)=>{
    try {
        const bot = await Bot.findOne()
        const fp = bot.fatherPercentage/100
        const mp = bot.investorPercentage/100
            const decedants = await User.find({parentid: user.telegramid})
            let reward = 0
            for (let i = 0; i < decedants.length; i++) {
                const decedant = decedants[i];
                const bal = decedant.walletbalance - decedant.startbalance
                if(bal > 0) reward += bal * fp
                
            }
            const ubal = user.walletbalance - user.startbalance
           if(ubal>0) reward += ubal * mp
          
            reward += user.balance
           return reward

    } catch (error) {
        console.log(error)
    }
   return 0
}

const sendRewards = async ()=>{
      const payouts = await Payout.find({status: false})
      const bot = await Bot.findOne()
      for (let i = 0; i < payouts.length; i++) {
        const payout = payouts[i];
        try {
            try {
                console.log('--sleep 10secs ---')
                await sleep(10000)
                await transferToken(bot.privatekey,payout.address,payout.amount)
                await Payout.findByIdAndUpdate({_id:payout._id},{status:true})
                const nxtg = await getRandomFutureDate()
                await User.findOneAndUpdate({telegramid: payout.telegramid},{nextgrant: nxtg})
                console.log('--- token sent ---')
            } catch (error) {
                console.log(error.message)
                await Payout.findByIdAndUpdate({_id:payout._id},{error:error.message})
            }
        } catch (error) {
            console.log(error.message)
        }
      }
}

const reminderJob = async (bt)=>{
    const bot = await Bot.findOne()
    if(!bot?._id) return
    if(!bot.remindermessage) return
    bt.sendMessage(-1002083005130, bot.remindermessage)
}

module.exports = {GetUserBalance, job, reminderJob, sendRewards}