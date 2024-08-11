const sharp = require('sharp');
const { User, TaskTrack, Task } = require('./models/models');

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
Start your answer with "question",
Example: question:pepsi`,
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
const sendQuestions = async (bot, chatId)=>{
    const tasks = await Task.find().lean()
    const options = {
        reply_markup: {
            inline_keyboard: tasks.map(q => [{
                text: q.text,
                callback_data: "question:"+q.question
            }])
        }
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

module.exports = {sendChoices, sendQuestions, getTask1, getTask2, handleAnswer}