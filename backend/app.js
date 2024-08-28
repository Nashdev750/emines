require('dotenv').config(); 
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { User, Bot, Task, Payout, Log, Channel, TaskTrack, WalletTracker } = require('../models/models');
const mongoose = require('mongoose');
const { format } = require('date-fns');
const exceljs = require('exceljs');
const _ = require('lodash');
const app = express();
const multer = require('multer');
const path = require('path');
const os = require('os');
const { DBCONNECTION } = require('../constants/db');
const { getDailyUsers, countActivitiesPerDay, getTodayQuestionClicks } = require('./utils');
const json = require('body-parser/lib/types/json');

function getNetworkIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over internal (i.e., 127.0.0.1) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}


// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())
app.use('/public', express.static('public'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/'); // Specify the upload directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Rename the file with a timestamp
    }
});
const upload = multer({ storage: storage });

// Set view engine
app.set('view engine', 'ejs');

// Default config
const defaultConfig = {
    apiKey: 'your-api-key',
    webhookUrl: 'https://example.com/webhook',
    pollInterval: 5
};

// Routes

app.get('/', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const logs = await Log.find().lean()
    const users = getDailyUsers(logs)
    const activities = countActivitiesPerDay(logs)
    const tasks = getTodayQuestionClicks(logs)
    
    let taskers = await TaskTrack.aggregate([
        {
            $lookup: {
                from: "users",           
                localField: "userid",    
                foreignField: "telegramid",     
                as: "userDetails"       
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                question: 1,
                Date: 1,
                "username": "$userDetails.telegramusername",
                "userid": 1
            }
        }
    ]);
     for (let i = 0; i < taskers.length; i++) {
        taskers[i].Date = format(new Date(taskers[i].Date), 'MM-dd-yyyy')
     }
     taskers = taskers.filter(tk=>tk.username != "")
    res.render('dashboard', { users, activities, tasks, taskers });
});
app.get('/channels', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const channels = await Channel.find().lean()
    

    res.render('channels', { channels });
});
app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'password') {
        req.session.user = username;
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});


app.get('/users', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    // Mock users
    let users = await User.find({ telegramid: { $ne: 6046745325 } }).sort({ createdAt: -1 });

   users = users.map(user => ({
        ...user.toObject(),
        createdAt: format(new Date(user.createdAt), 'MM-dd-yyyy HH:mm:ss'),
        nextgrant: user.nextgrant?format(new Date(user.nextgrant), 'MM-dd-yyyy'):""
    }));
  
    res.render('users', { users });
});

app.get('/export-logs', async (req, res) => {
    const logs = await Log.find().lean().sort({ Date: -1 })
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('logs');
    worksheet.columns = [
        { header: 'ID', key: 'telegramid', width: 20 },
        { header: 'Activity', key: 'activity', width: 20 },
        { header: 'Date', key: 'Date', width: 20 }
    ];
    try {
         // Add rows
         logs.forEach(log => {
            worksheet.addRow({
                telegramid: log.telegramid,
                activity: log.activity,
                Date: log.Date,
            });
        });
        // Set response headers
        res.setHeader('Content-Disposition', 'attachment; filename=logs.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write the Excel file to the response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error'); 
    }
})
app.post('/webhook', async (req, res)=>{
    if(!req.body[0].source.toLowerCase().includes("raydium")) return
    if(!req.body[0].description.toLowerCase().includes("swapped")) return
    const requestBody = JSON.stringify(req.body[0])
    if(requestBody == "{}") return res.send({success:false})
    
    await WalletTracker.create({
      wallet: "",
      activity: requestBody
    })
    res.send({success:true})
})
app.get('/export-taskers', async (req, res) => {
    let taskers = await TaskTrack.aggregate([
        {
            $lookup: {
                from: "users",           
                localField: "userid",    
                foreignField: "telegramid",     
                as: "userDetails"       
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                question: 1,
                Date: 1,
                "username": "$userDetails.telegramusername",
                "userid": 1
            }
        }
    ]);
     for (let i = 0; i < taskers.length; i++) {
        taskers[i].Date = format(new Date(taskers[i].Date), 'MM-dd-yyyy')
     }
    const logs = taskers.filter(tk=>tk.username != "")
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('taskers');
    worksheet.columns = [
        { header: 'Username', key: 'username', width: 20 },
        { header: 'Task', key: 'question', width: 20 },
        { header: 'Date', key: 'Date', width: 20 }
    ];
    try {
         // Add rows
         logs.forEach(log => {
            worksheet.addRow({
                username: log.username,
                question: log.question,
                Date: log.Date,
            });
        });
        // Set response headers
        res.setHeader('Content-Disposition', 'attachment; filename=taskers.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write the Excel file to the response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error'); 
    }
})

// Route to export users to Excel
app.get('/export-users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }); // Sort by createdAt in descending order

        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Users');

        // Define columns
        worksheet.columns = [
            { header: 'Child Id', key: 'telegramid', width: 20 },
            { header: 'Father Id', key: 'parentid', width: 20 },
            { header: 'Telegram username', key: 'telegramusername', width: 20 },
            { header: 'Balance', key: 'balance', width: 20 },
            { header: 'start balance', key: 'startbalance', width: 20 },
            { header: 'wallet balance', key: 'walletbalance', width: 20 },
            { header: 'Twitter', key: 'tweeter', width: 20 },
            { header: 'Address', key: 'address', width: 20 },
            { header: 'Joined On', key: 'createdAt', width: 20 },
            { header: 'Next grant', key: 'nextgrant', width: 20 },
        ];
       
        // Add rows
        users.forEach(user => {
            worksheet.addRow({
                telegramid: user.telegramid,
                parentid: user.parentid,
                telegramusername: user.telegramusername,
                balance: user.balance,
                startbalance: user.startbalance,
                walletbalance: user.walletbalance,
                tweeter: user.tweeter,
                address: user.address,
                createdAt: format(new Date(user.createdAt), 'MM-dd-yyyy HH:mm:ss'),
                nextgrant: user.nextgrant?format(new Date(user.nextgrant), 'MM-dd-yyyy'):""
            });
        });
        // Set response headers
        res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        // Write the Excel file to the response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.get('/bot-config', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    
    let config = await Bot.findOne();
    console.log(config)
    return res.render('bot-config', { config });
    
});

app.post('/bot-config', upload.single('captcha'), async (req, res) => {
    try {
        const { captchaText, captchaAnswer, fatherPercentage, investorPercentage, grantMin, grantMax,
            remindermessage, reminderinterval,
            fatherCoins, investorCoins,detailstext
         } = req.body;
        const captchaImagePath = req.file.path;
        console.log(req.file)
        // Process the form data and save it to your database
        const botConfig = {
            captchaImagePath,
            captchaText,
            captchaAnswer,
            fatherPercentage: parseFloat(fatherPercentage),
            investorPercentage: parseFloat(investorPercentage),
            grantRangeMin: parseFloat(grantMin),
            grantRangeMax: parseFloat(grantMax),
            remindermessage, reminderinterval,
            fatherCoins, investorCoins,detailstext
        };
        const bot = await Bot.findOne()
        if(bot?._id){
            await Bot.findByIdAndUpdate({_id:bot._id},botConfig)
        }
        // Save botConfig to your database (example using MongoDB)
        // await BotConfig.create(botConfig);

        console.log('Bot configuration saved:', botConfig);
        res.send('Configuration saved successfully!');
    } catch (error) {
        console.error('Error saving configuration:', error);
        res.status(500).send('An error occurred while saving the configuration.');
    }
});
app.get('/logout', (req, res) => {
    // Clear the token on the client side (e.g., by clearing cookies or local storage)
    res.clearCookie('token');
    res.redirect('/login');
});
// s

app.get('/daily-tasks', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    const task = {}
    const tasks = await Task.find().lean()
    for (let i = 0; i < tasks.length; i++) {
        tasks[i].image = "public/"+tasks[i].image
        tasks[i].options = tasks[i].options.map(itm=>itm.text).join(', ')
        
    }
    res.render('daily-tasks', { task, tasks });
});



// save tasks
app.post('/tasks/save', upload.single('image'), async (req, res) => {
    const { question, reward, description,channelid, text, answer, options } = req.body;
    let image = req.file.filename;

    const taskData = {
        question,
        image: image,
        reward,
        description,
        channelid,
        text,
        answer,
        options: options ? options.split(',').map(opt => ({ text: opt.trim() })) : []
    };
    await Task.findOneAndDelete({question:Number(question)})
    await Task.create(taskData)

    res.redirect('/daily-tasks');
});

app.get('/transactions', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    try {
        const payouts = await Payout.find().sort({ createdAt: -1 });
        res.render('payouts', { payouts });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});








// Start the server
app.listen(3000,() => {
    console.log(`Server started on http://localhost:3000`);
});
mongoose.connect(process.env.CONNECTIONSTRING)