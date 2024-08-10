const pk = ''

const { User, Bot } = require('./models/models');

mongoose.connect(`mongodb://127.0.0.1:27017/solana`)
.then(async ()=>{
    const bot = await Bot.findOne()
    await Bot.findByIdAndUpdate({_id:bot._id},{
        privatekey:pk,
        address:'DnFqKUqhrinjhy42usZXSPpNNTyL5LDkdySsnGSPvKQt'
    })
    await User.deleteMany()
})