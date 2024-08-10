const { User, Payout, Bot } = require('./models/models');
const { transferToken } = require('./sendSPL');
const { getTokenBalance, sendToken } = require('./solana');
const { getRandomFutureDate } = require('./utils');

const findUsersWithTodayGrant = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const users = await User.find({ nextgrant: today }).lean();

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
        const fp = bot.fatherPercentage
        const mp = bot.investorPercentage
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const decedants = await User.find({parentid: user.telegramid})
            let reward = 0
            for (let i = 0; i < decedants.length; i++) {
                const decedant = decedants[i];
                try {
                    const bal = await getTokenBalance(decedant.address) - decedant.startbalance
                    if(bal > 0) reward += bal * fp
                } catch (error) {
                    
                }
                
            }
            try {
                const bal = await getTokenBalance(user.address) - user.startbalance
               if(bal> 0) reward += bal * mp
            } catch (error) {
                
            }
            try {
                await User.findOneAndUpdate({telegramid:user.telegramid},{balance: 0})
                reward += user.balance
            } catch (error) {
                
            }
            if(reward > 0){
                await Payout.create({
                    telegramid: user.telegramid,
                    address: user.address,
                    telegramusername: user.telegramusername,
                    amount: reward
                })
            }
        }
        // send tokens
        await sendRewards()

    } catch (error) {
        
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
                await transferToken(bot.privatekey,payout.address,payout.amount)
                await Payout.findByIdAndUpdate({_id:payout._id},{status:true})
                await User.findOneAndUpdate({telegramid: payout.telegramid},{nextgrant: getRandomFutureDate()})
            } catch (error) {
                await Payout.findByIdAndUpdate({_id:payout._id},{error:error.message})
            }
        } catch (error) {
            
        }
      }
}

const reminderJob = async (bt)=>{
    const bot = await Bot.findOne()
    if(!bot?._id) return
    if(!bot.remindermessage) return
    bt.sendMessage(-1002083005130, bot.remindermessage)
}

module.exports = {GetUserBalance, job, reminderJob}