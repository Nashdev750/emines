function getDailyUsers(logs) {
    const registrationsPerDay = {};

    logs
        .filter(log => log.activity.startsWith('/start')) // Step 1: Filter logs by activity
        .forEach(log => {
            const { telegramid, Date: date } = log;

            if (!registrationsPerDay[date]) {
                registrationsPerDay[date] = new Set(); // Step 2: Create a Set for unique ids per day
            }

            registrationsPerDay[date].add(telegramid); // Step 3: Add telegramid to the Set
        });

    const uniqueRegistrationsCountPerDay = {};
    for (const date in registrationsPerDay) {
        uniqueRegistrationsCountPerDay[date] = registrationsPerDay[date].size; // Step 4: Count unique ids per day
    }
    const uniqueRegistrationsArray = Object.keys(registrationsPerDay).map(date => {
        return { date: date, users: registrationsPerDay[date].size }; // Step 4: Create the desired format
    });
    return uniqueRegistrationsArray;
}


function countActivitiesPerDay(logs) {
    const activityCounts = {};

    logs.forEach(log => {
        const { Date: date } = log;

        if (!activityCounts[date]) {
            activityCounts[date] = 0;
        }

        activityCounts[date]++; // Increment count for the date
    });

    // Convert the result to the desired format
    const activityCountsArray = Object.keys(activityCounts).map(date => {
        return { date: date, impressions: activityCounts[date] }; // Step 4: Create the desired format
    });

    return activityCountsArray;
}

// Function to get today's date in the same format as logs
function getTodayDate() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = today.getFullYear();
    return `${month}-${day}-${year}`;
}

function getTodayQuestionClicks(logs) {
    const todayDate = getTodayDate();
    const questionClicks = {
        'question:1': new Set(),
        'question:2': new Set(),
        'question:3': new Set()
    };

    logs
        .filter(log => log.Date === todayDate) // Filter logs for today
        .forEach(log => {
            const { telegramid, activity } = log;
            if (questionClicks[activity]) {
                questionClicks[activity].add(telegramid); // Add unique users to the set
            }
        });

    // Convert the result to the desired format
    const questionClicksArray = Object.keys(questionClicks).map(question => {
        return { question: question, users: questionClicks[question].size }; // Count unique users
    });

    return questionClicksArray;
}





module.exports = {getDailyUsers, countActivitiesPerDay, getTodayQuestionClicks}