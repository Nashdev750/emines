const sharp = require('sharp');
const { User, Bot } = require('./models/models');
const { getRandomFutureDate, updateWalletBalance } = require('./utils');
const { GetUserBalance } = require('./job');
const { QUESTIONS } = require('./constants/commands');

const startRegister = async (bot, chatId)=>{
    const msg = `Welcome to the #EmmS Network! 🤝

Click the "Submit Details" button and complete the registration process. ✅

By the end of the registration process you earn #EmmS tokens to make you an #EmmS hodler right away. 🫡

By belonging to the Em&mS Network you and your friends can earn extra #EmmS tokens for each of your friends who join the #EmmS Network by using your referral link which you'll get after completing the registration process. 🔥

Besides, you get additional 0.5% of #EmmS balance you have both in your wallet and in your friends wallets. 🚀

You get also #EmmS if your friends play in the Casino. 🎰 

Last but not the least, you can get free #EmmS as well by doing daily task and be eligible to the monthly draws. 😉

Complete the registration process and start earning #EmmS... 💸

All info here: @eminemsbotinfo`

    try {
        const keyboard = {
            reply_markup: {
              keyboard: [
              [{ text: 'Submit Details' }]
              ],
              resize_keyboard: true, // Optionally resize the keyboard
              one_time_keyboard: true // Optionally hide the keyboard after a button is pressed
            }
          };
        const imagePath = 'welcome.jpg';
        // Step 2: Resize the image and get it as a buffer
        const resizedImageBuffer = await sharp(imagePath)
            .resize({ width: 500  }) // Resize to 500px width, adjust as needed
            .toBuffer();

        // Step 3: Send the resized image with a caption
        bot.sendPhoto(chatId, resizedImageBuffer, {
            caption: msg,
            ...keyboard
        });
    } catch (err) {
        console.error('Error resizing image:', err);
        bot.sendMessage(chatId, "Sorry, something went wrong");
    }

    
}
const catpchaStep = async (bot, chatId,botConf)=>{
    const msg = botConf.captchaText
        try {
            const keyboard = {
                reply_markup: {
                    remove_keyboard: true
                }
              };
            const imagePath = 'backend/'+botConf.captchaImagePath;
            // Step 2: Resize the image and get it as a buffer
            const resizedImageBuffer = await sharp(imagePath)
                .resize({ height: 150 }) // Resize to 500px width, adjust as needed
                .toBuffer();
    
            // Step 3: Send the resized image with a caption
            bot.sendPhoto(chatId, resizedImageBuffer, {
                caption: msg,
                ...keyboard
            });
        } catch (err) {
            console.error('Error resizing image:', err);
            bot.sendMessage(chatId, "Sorry, something went wrong");
        }
} 

const saveUserData = async (bot, chatId,id,username)=>{
    try {     
        const conf = await Bot.findOne()
        const user = await User.find({telegramid: chatId}) 
        if(user?.length > 0) return
        const grant = await getRandomFutureDate()
        const user1 = {telegramid:chatId,telegramusername:username,balance:conf.investorCoins, nextgrant: grant}
        if(id) user1.parentid = id
        if(chatId == id) user1.parentid = null
        
        await User.create(user1)
        const parent  = await User.findOne({telegramid:id})
        if(parent?.telegramid){
            User.findOneAndUpdate({telegramid: id},{balance: parent.balance + conf.fatherCoins})
        }
    } catch (error) {
        console.log(error.message)
    }
}
const UpdateUserData = async (bot, chatId,username)=>{
    try {     
        await User.findOneAndUpdate({telegramid: chatId},{tweeter:username})
    } catch (error) {
        console.log(error.message)
    }
}
const UpdateUserAdress = async (bot, chatId,address)=>{
    try {     
        await User.findOneAndUpdate({telegramid: chatId},{address})
    } catch (error) {
        console.log(error.message)
    }
}
const joinTelegramGroup = async (bot, chatId,mg=undefined)=>{
    const keyboard = {
        reply_markup: {
          keyboard: [
          [{ text: '✅ Done' }]
          ],
          resize_keyboard: true, // Optionally resize the keyboard
          one_time_keyboard: true // Optionally hide the keyboard after a button is pressed
        },
        parse_mode: 'HTML' 
      };
    const msg = mg ? mg : `🔘 Join our <a href='https://t.me/+9xoYX7DetRFkOWQ0'>Telegram channel</a>.

Then click the "Done" button.`
bot.sendMessage(chatId, msg, keyboard);
}

const followTweeter = (bot, chatId)=>{
    const keyboard = {
    
        parse_mode: 'HTML' ,
        reply_markup: {
            remove_keyboard: true
        }
      };
    const msg = `🔘 Follow our <a href='https://x.com/eminemssoleng'>X (Twitter)</a> & like + retweet last post.

Then submit your X username;
Example: @username`
bot.sendMessage(chatId, msg, keyboard);
}
const provideAdress = (bot, chatId)=>{
    const keyboard = {
    
        parse_mode: 'HTML' 
      };
    const msg = `🔘 Submit your Solana (SOL) wallet address:

Don't have a wallet?
Create one with Phantom or Solflare.`
bot.sendMessage(chatId, msg, keyboard);
}




const finishReg = async (bot, chatId)=>{
updateWalletBalance(chatId,true)
const user = await User.findOne({telegramid:chatId}).lean()
const msg = `You have 0 referrals ✅
Balance: 0 🏆 

Your registered data:
Telegram: @${user.telegramusername}
Twitter: ${user.tweeter.includes("@")?user.tweeter:'@'+user.tweeter}
SOL Wallet: ${user.address}

Invite as many people (customers) as you want, there’s NO LIMIT. 🚀

More Work = More Money 🔥

🚨 Your referral link:
https://t.me/Eminemssolbot?start=${chatId}

Click the link to copy. Send it to your friends! 😈

All info here: @eminemsbotinfo`

const keyboard = {
    reply_markup: {
      keyboard: [
      [
        { text: '👤 Account' },
        { text: '🏆 Leaderboard' }

      ],
      [
        { text: QUESTIONS}
      ]
      ],
      resize_keyboard: true, // Optionally resize the keyboard
      one_time_keyboard: false // Optionally hide the keyboard after a button is pressed
    } 
  };

  try {
    const imagePath = 'network.jpg';
    // Step 2: Resize the image and get it as a buffer
    const resizedImageBuffer = await sharp(imagePath)
        .resize({ width: 500  }) // Resize to 500px width, adjust as needed
        .toBuffer();

    // Step 3: Send the resized image with a caption
    bot.sendPhoto(chatId, resizedImageBuffer, {
        caption: msg,
        ...keyboard,
        parse_mode: 'HTML',
    });
} catch (err) {
    console.error('Error resizing image:', err);
    bot.sendMessage(chatId, "Sorry, something went wrong");
}
}

const getReaderBoard = async (bot, chatId)=>{
  
      let referralStats = await User.find().lean();
      for (let i = 0; i < referralStats.length; i++) {
        referralStats[i].totalReferrals = referralStats.filter(usr=>usr.parentid ==  referralStats[i].telegramid ).length
      }
      referralStats = referralStats.sort((a, b) => b.totalReferrals - a.totalReferrals);
      
      referralStats = referralStats.slice(0, 101);
      for (let i = 0; i < referralStats.length; i++) {
        if(referralStats[i].telegramid == 6046745325){
          referralStats[i].totalReferrals = 0
        }
        
      }
      referralStats = referralStats.sort((a, b) => b.totalReferrals - a.totalReferrals);
      const totalusers = referralStats.slice(0, 100)
      let txt = `<b>users with the most referrals:</b>
    
`
       for (let i = 0; i < totalusers.length; i++) {
        const user = totalusers[i];
        txt+=`${i+1}. ${user.telegramusername?user.telegramusername:'Anonymous'} - ${user.totalReferrals}
`
       }
      
      bot.sendMessage(chatId, txt,{ parse_mode: 'HTML' })
}


const getAccount = async (bot, chatId)=>{
    updateWalletBalance(chatId)
    const user = await User.findOne({telegramid:chatId}).lean()
    const refs = await User.find({parentid:user.telegramid}).lean()
    const bal = await GetUserBalance(user)
    const msg = `You have ${refs.length} referrals ✅
    
Balance: ${bal.toFixed(2)} Coins 🏆 

Your registered data:
Telegram: @${user.telegramusername}
Twitter: ${user.tweeter.includes("@")?user.tweeter:'@'+user.tweeter}
SOL Wallet: ${user.address}

Invite as many people (customers) as you want, there’s NO LIMIT. 🚀

More Work = More Money 🔥

🚨 Your referral link:
https://t.me/Eminemssolbot?start=${chatId}

Click the link to copy. Send it to your friends! 😈

All info here: @eminemsbotinfo`

const keyboard = {
    reply_markup: {
      keyboard: [
      [
        { text: '👤 Account' },
        { text: '🏆 Leaderboard' }

      ],
      [
        { text: QUESTIONS}
      ]
      ],
      resize_keyboard: true, // Optionally resize the keyboard
      one_time_keyboard: false // Optionally hide the keyboard after a button is pressed
    } 
  };

  try {
    const imagePath = 'network.jpg';
    // Step 2: Resize the image and get it as a buffer
    const resizedImageBuffer = await sharp(imagePath)
        .resize({ width: 500 }) // Resize to 500px width, adjust as needed
        .toBuffer();

    // Step 3: Send the resized image with a caption
    bot.sendPhoto(chatId, resizedImageBuffer, {
        caption: msg,
        ...keyboard,
        parse_mode: 'HTML',
    });
} catch (err) {
    console.error('Error resizing image:', err);
    bot.sendMessage(chatId, "Sorry, something went wrong");
}
}



module.exports = {
        startRegister, 
        catpchaStep, 
        saveUserData, 
        joinTelegramGroup, 
        followTweeter,
        UpdateUserData,
        UpdateUserAdress,
        provideAdress,
        finishReg,
        getReaderBoard,
        getAccount

    }