require('dotenv').config(); 
const TelegramBot = require('node-telegram-bot-api');
const { startRegister, catpchaStep, saveUserData, joinTelegramGroup, followTweeter, UpdateUserData, UpdateUserAdress, provideAdress, finishReg, getReaderBoard, getAccount} = require('./botFunctions');
const { SUBMITDETAILS, JOINGROUP, FOLLOWTWEETER, DONE, CATPCHA, ADDRESS } = require('./constants/steps');
const mongoose = require('mongoose');
const { User, Bot, Channel } = require('./models/models');
const { SAVEUSER, JOINEDTELEGRAM, ACCOUNT, LEADERBOARD, QUESTIONS, TASK1, TASK2, TASK3 } = require('./constants/commands');
const { isUserInChannel } = require('./socials');
const { isValidSolanaAddress, getWallet } = require('./solana');
const { sendQuestions, getTask1, getTask2, handleAnswer, getTask3, handleTelegram } = require('./questions');
const { updateWalletBalance, logActivity } = require('./utils');
const { job, reminderJob, sendRewards } = require('./job');
const { DBCONNECTION } = require('./constants/db');

// Replace with your bot token from BotFather
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });


let keyboard = {
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
      resize_keyboard: true, 
      one_time_keyboard: false
    } 
  };

const userSteps = {}
const lastCap = {}
const pending = {}
const referrals = {};
const ingroup = {};
const doneReg = {};
const accountCheck = {};

const answer = 'pepsi'
// Step 1: Handle the /start command
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    if(isChennel(chatId)) return console.log('----channel---')
    logActivity(chatId,"start")
    const referralCode = match[1];
    if (referralCode != undefined) referrals[msg.chat.id] = referralCode
   
    delete userSteps[chatId]
    delete lastCap[chatId]
    delete pending[chatId]
    delete ingroup[chatId]
    delete doneReg[chatId]
    delete accountCheck[chatId]
    for (const key in pending) {
        if (key.startsWith(chatId)) {
            delete pending[key]; 
        }
    }
   
    // await User.findOneAndDelete({telegramid: chatId})
    handleEvent(msg)
});


// Step 4: Handle user responses
bot.on('message', async (msg) => { 
    const chatId = msg.chat.id;
    if(isChennel(chatId)){
        try {
            await Channel.create({
                channelid: chatId,
                title:msg?.chat?.title ? msg.chat.title : "NA",
                message:JSON.stringify(msg)
            })
        } catch (error) {
        }
        return
    }
    logActivity(chatId,msg?.text)
    if (msg?.text?.startsWith('/start')) {
        
        
        return; // Skip further processing
    }
    
    // sendChoices(bot,chatId)
    handleEvent(msg)
});


const isChennel = (id)=>{
    return id.toString().includes('-') || id.toString() == '-1002083005130'
}

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
    const message = callbackQuery.message;
    const data = callbackQuery.data;
    message.text = data
    const chatId = message.chat.id;
    logActivity(chatId,message?.text)
    // Delete the original message
    handleEvent(message)

  });

const handleEvent = async (msg)=>{
    const botConf = await Bot.findOne()
    const chatId = msg.chat.id;
    if(checkCap(chatId)){ 
        lastCap[chatId] = new Date()
        userSteps[chatId] = CATPCHA
        return catpchaStep(bot, chatId, botConf)
    }
    console.log(userSteps[chatId])
    if(msg.text.toLowerCase().trim() != botConf.captchaAnswer.toLowerCase() && userSteps[chatId] == CATPCHA){
       return bot.sendMessage(chatId,"❌ Wrong answer, please try again")
    }else if(msg.text.toLowerCase().trim() == botConf.captchaAnswer.toLowerCase() && userSteps[chatId] == CATPCHA){
        msg.text = ACCOUNT
    }
    handleSteps(msg)
}

const handleSteps = async (msg)=>{
    const chatId = msg.chat.id;
    await checkUserStep(msg)
    const step = userSteps[chatId]
    console.log(step)
    let key  = ""
    switch(step){  
        case SUBMITDETAILS:
            key = `${chatId}_${SUBMITDETAILS}`
            if(key in pending){
                // msg.text = SAVEUSER
                await handleCommands(msg)
            }else{
                startRegister(bot, chatId)
                pending[key] = SUBMITDETAILS
            }
            break;
        case JOINGROUP:
            key = `${chatId}_${JOINGROUP}`
            if(key in pending){
                await handleCommands(msg)
           }else{
                joinTelegramGroup(bot, chatId)
                pending[key] = JOINGROUP
           }
            break;
        case FOLLOWTWEETER:
            key = `${chatId}_${FOLLOWTWEETER}`
            if(key in pending){
                await UpdateUserData(bot, chatId, msg.text)
                handleSteps(msg)
            }else{
                followTweeter(bot, chatId)  
                pending[key] = FOLLOWTWEETER
            }
            break;
        case ADDRESS:
            key = `${chatId}_${ADDRESS}`
            if(key in pending){
                if(!isValidSolanaAddress(msg.text)) return bot.sendMessage(chatId,"Invalid SOL address, Please try again")
                await UpdateUserAdress(bot, chatId, msg.text)  
                return finishReg(bot, chatId)
            }else{
                provideAdress(bot, chatId)
                pending[key] = ADDRESS
            }
            break;
        case DONE:  
            doneReg[chatId] = ""  
            finishReg(bot, chatId)
            break;    
        default: 
            handleCommands(msg)
            break; 
    }
}


const handleCommands = async (msg)=>{
    const text = msg.text;
    const chatId = msg.chat.id;

    switch (text) {
        case SAVEUSER:
            const username = msg.chat.username || '';
            await saveUserData(bot,chatId,referrals[chatId],username)
            handleSteps(msg)
            break;
        case JOINEDTELEGRAM:
            const userInChanel = await isUserInChannel(bot, chatId)
            if(!userInChanel) return joinTelegramGroup(bot,chatId,"You are not in telegram channel please try again")
            ingroup[chatId] = ''
            handleSteps(msg)
            break;
        case LEADERBOARD:
            getReaderBoard(bot, chatId)   
            break;
        case ACCOUNT:
            if(!(chatId in accountCheck) || accountCheck[chatId]){
                lastCap[chatId] = new Date()
                userSteps[chatId] = CATPCHA
                accountCheck[chatId] = false
                const botConf = await Bot.findOne()
                return catpchaStep(bot, chatId,botConf)
            }
            accountCheck[chatId] = true
            
            getAccount(bot, chatId)
            break;     
        default:
            console.log(text)
            if(
            text.toLowerCase().includes("question") ||
            text.toLowerCase().includes("answer") ||
            text.toLowerCase().includes("telegram") ||
             text.toLowerCase().includes(QUESTIONS.toLowerCase()
            )
            ) return handTask(msg)
            
            const kb = await getKeyboard(msg)
            console.log(kb)
            bot.sendMessage(chatId,"Invalid command",kb)  
            break;
    }
}

const handTask = async (msg)=>{
    const text = msg.text;
    const chatId = msg.chat.id;
    console.log(text)
    switch (text) {
        case QUESTIONS:
            sendQuestions(bot, chatId)
            break;
        case TASK1:
            getTask1(bot, chatId)
            break;
        case TASK2:
            getTask2(bot, chatId)
            break;
        case TASK3:
            getTask3(bot, chatId)
            break;
        default:

            if(text.toLowerCase().includes('question') || 
                text.toLowerCase().includes('answer')
            ){
              const itms = text.split(':')
              if(itms.length == 2){
               return handleAnswer(bot, chatId, itms[1], 1)
              }else if(itms.length == 3){
                return handleAnswer(bot, chatId, itms[2], 2)
              } 
              
            }
            if(text.startsWith("telegram")){
               return handleTelegram(bot,chatId,text,2)
            }
            const kb = await getKeyboard(msg)
            bot.sendMessage(chatId,"Invalid command",kb)  
            break;
    }
}


const checkUserStep = async (msg)=>{
    const chatId = msg.chat.id;
    const user = await User.find({telegramid: chatId})
    const userInChanel = await isUserInChannel(bot, chatId)
    userSteps[chatId] = DONE
    if(!user[0]?.address) userSteps[chatId] = ADDRESS
    if(user[0]?.tweeter == "") userSteps[chatId] = FOLLOWTWEETER
    if(!userInChanel) userSteps[chatId] = JOINGROUP
    if(!(user?.length > 0)) userSteps[chatId] = SUBMITDETAILS
    
    if(userSteps[chatId] == DONE && chatId in doneReg) userSteps[chatId] = ''
}

const getKeyboard = async (msg)=>{
   await checkUserStep(msg)
   const chatId = msg.chat.id;
   if(userSteps[chatId] == JOINGROUP){
     return {
        reply_markup: {
          keyboard: [
          [
            { text: JOINEDTELEGRAM }
          ]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        } 
      };
   }
   if(userSteps[chatId] == SUBMITDETAILS){
     return {
        reply_markup: {
          keyboard: [
          [
            { text: SAVEUSER }
          ]
          ],
          resize_keyboard: true, 
          one_time_keyboard: true 
        } 
      };
   }
   return keyboard
}
console.log('Bot is running...');

let reminderinterval = 1000*60*60*24
mongoose.connect(DBCONNECTION)
.then(async ()=>{
    console.log("connected")
    setInterval(job,1000*60*60*24)
    setInterval(sendRewards,1000*60*60*12)
    
    const [publickey, secretKeyString] = getWallet()
    try {
        const bots = await Bot.find()
        if(bots.length == 0){
            await Bot.create({
                privatekey: secretKeyString,
                address: publickey
            })
        }
         

    } catch (error) {
      console.log(error)  
    }
    
    setInterval(async ()=>{
        const botc = await Bot.findOne()
        reminderinterval = botc.reminderinterval
        await reminderJob(bot)
    },reminderinterval)
});



const isOver24Hours = (pastTime) => {
    const now = new Date();
    const pastDate = new Date(pastTime);
    const differenceInMs = now - pastDate;
    const differenceInHours = differenceInMs / (1000 * 60 * 60);
    return differenceInHours >= 24;
};

const checkCap = (chatid)=>{
  if(chatid in lastCap){
    const lp = isOver24Hours(lastCap[chatid])
    if(lp){
        updateWalletBalance(chatid)
    }
    return lp
  }
  return true
}