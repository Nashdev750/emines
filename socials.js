const isUserInChannel = async (bot, chatId) => {
    try {
        const channelUsername = '@solana_test_g'; // Replace with your channel's username

        // Step 1: Get the Channel ID using the username
        const chat = await bot.getChat(channelUsername);
        const channelId = chat.id;

        // Step 2: Check if the user is a member of the channel
        const chatMember = await bot.getChatMember(channelId, chatId);
        const status = chatMember.status;

        // Check if the user is a member of the channel
        if (status === 'member' || status === 'administrator' || status === 'creator') {
            return true; // User is a member
        } else {
            return false; // User is not a member
        }
    } catch (error) {
        console.log('Error checking group membership:', error.message);
        return false;
    }
};


const tweeter = ()=>{
    
}


module.exports = {isUserInChannel}