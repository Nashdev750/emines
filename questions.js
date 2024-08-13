const sharp = require('sharp');
const { User, TaskTrack, Task, Channel } = require('./models/models');
const { isUserInChannel, isUserInChannel2 } = require('./socials');

const questions = [
    {
        question:1,
        image: 'welcome.jpg',
        reward:10,
        description:"Name this brand to earn coins",
        text: 'Daily Task 1 🚀💛',
        answer:"pepsi"
    },
    {
        question:2,
        image: 'welcome.jpg',
        reward:10,
        text:'Daily Task 2 🚀💛',
        description:"Name this brand to earn coins",
        answer:"pepsi",
        options:[
            {
                text:"Pepsi",
            },
            {
                text:"Prime",
            },
            {
                text:"Coke",
            }
        ]
    }
]

const getTask1 = async (bot, chatId)=>{
      const task1 = await Task.findOne({question:1})
      try {
        const imagePath = "backend/public/"+task1.image
        const resizedImageBuffer = await sharp(imagePath)
            .resize({ height: 500 }) 
            .toBuffer();
        bot.sendPhoto(chatId, resizedImageBuffer, {
            caption: task1.description+`
Start your answer with "answer",
Example: answer:pepsi`,
        });
    } catch (err) {
        console.error('Error resizing image:', err);
        bot.sendMessage(chatId, "Sorry, something went wrong");
    }
}
const getTask2 = async (bot, chatId)=>{
    const task2 = await Task.findOne({question:2})
    try {
      const imagePath = "backend/public/"+task2.image
      const resizedImageBuffer = await sharp(imagePath)
          .resize({ height: 500 }) 
          .toBuffer();

      const options = {
            reply_markup: {
                inline_keyboard: task2.options.map(o => [{
                    text: o.text,
                    callback_data: "question:2:"+o.text
                }])
            }
      };    
      bot.sendPhoto(chatId, resizedImageBuffer, {
          caption: task2.description,
          ...options
      });
  } catch (err) {
      console.error('Error resizing image:', err);
      bot.sendMessage(chatId, "Sorry, something went wrong");
  }
}

const getTask3 = async (bot, chatId)=>{
    const task3 = await Task.findOne({question:3})
    try {
      const imagePath = "backend/public/"+task3.image
      const resizedImageBuffer = await sharp(imagePath)
          .resize({ height: 500 }) 
          .toBuffer();
 
      const keyboard = {
        reply_markup: {
          inline_keyboard: [
          [{ text: '✅ Done',callback_data: "telegram:"+task3.channelid }]
          ],
          resize_keyboard: true, // Optionally resize the keyboard
          one_time_keyboard: true // Optionally hide the keyboard after a button is pressed
        },
        parse_mode: 'HTML' 
      };  
      bot.sendPhoto(chatId, resizedImageBuffer, {
          caption: task3.description,
          ...keyboard
      });
  } catch (err) {
      console.error('Error resizing image:', err);
      bot.sendMessage(chatId, "Sorry, something went wrong");
  }
}

const sendQuestions = async (bot, chatId)=>{
    const tasks = await Task.find().lean()
    const options = {
        reply_markup: {
            inline_keyboard: tasks.map(q => [{
                text: q.text,
                callback_data: "question:"+q.question
            }])
        },
        
    };
    bot.sendMessage(chatId, 'Please choose a task', options);
}


const sendChoices = (bot, chatId)=>{
    const options = {
        reply_markup: {
            inline_keyboard: question.options.map(option => [{
                text: option.text,
                callback_data: option.answer
            }])
        }
    };
    bot.sendMessage(chatId, 'Please choose an answer:', options);
}

const handleAnswer = async (bot, chatId, answer, question)=>{
         const task = await Task.findOne({question})
         const currentDate = new Date();
         currentDate.setHours(0, 0, 0, 0);

         const track = await TaskTrack.find({
            userid:chatId,
            question,
            Date: currentDate
         })

         if(track.length>0) return bot.sendMessage(chatId, "You have already attempted daily task "+(question))
         await TaskTrack.create({
                userid:chatId,
                question,
                Date: currentDate
        })
         if(answer.toLowerCase().trim() == task.answer.toLocaleLowerCase()){
            const user = await User.findOne({telegramid: chatId})
            await User.findByIdAndUpdate({_id:user._id},{balance: user.balance+task.reward})
            return bot.sendMessage(chatId, "✅ Correct!, you earned "+task.reward+" coins this task")
         }
         
       
         bot.sendMessage(chatId, "❌Wrong answer, you can retry this task tomorrow")
}
const handleTelegram = async (bot, chatId, text, question)=>{
      const task = await Task.findOne({question})
      const itms = text.split(":")
      console.log(itms)
      if(itms.length != 2) return
      const channel = await Channel.findOne({channelid: itms[1]}) 
      console.log('--->',channel)
      if(!channel?._id) return bot.sendMessage(chatId, "❌Channel not found, please try again later")
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const track = await TaskTrack.find({
        userid:chatId,
        question,
        title: itms[1]
     })
      console.log('-----checking user----')
      const userInChanel = await isUserInChannel2(bot, chatId, channel.channelid)
      console.log('-----checking user----', userInChanel)

      if(!userInChanel) return bot.sendMessage(chatId, "You have not joined the channel, please join and try again")

      if(userInChanel && track.length == 0){
        const user = await User.findOne({telegramid: chatId})
        await User.findByIdAndUpdate({_id:user._id},{balance: user.balance+task.reward})
        await TaskTrack.create({
            userid:chatId,
            question,
            title: itms[1],
            Date: currentDate
        })
        return bot.sendMessage(chatId, "✅ Task completed!, you earned "+task.reward+" coins this task")
      }
   
      bot.sendMessage(chatId, "✅ You have already completed this task, please check tomorrow for a different task")
}


module.exports = {sendChoices, sendQuestions, getTask1, getTask2, handleAnswer, getTask3,handleTelegram}