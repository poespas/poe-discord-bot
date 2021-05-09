const captureWebsite = require('capture-website');
const fs = require("fs");

let msgusers = {};

const Activity = {
    Init: (client, actions) => {
        console.log("[ ACTIVITY ] Initialized");
        actions.RegisterCommand("!activity", Activity.OnMessageActivity);
    },
    OnMessageActivity: async (msg) => {
        let userID = msg.author.id;
    
        if (msgusers[userID] && new Date(msgusers[userID].getTime() + 5000) > new Date()) {
            return msg.reply("calm down wtf");
        }
    
        msgusers[userID] = new Date();

        let path = `./media/${userID}.png`;

        if (!fs.existsSync('./media')) {
            fs.mkdirSync('./media');
        }

        if (fs.existsSync(path)) {
            fs.unlinkSync(path);
        }

        await takeScreenshot(userID, path);

        msg.channel.send(`Here is your activity chart <@${userID}> !!`, {
            files: [
                path
            ]
        });
    }
}

async function takeScreenshot(userID, toFile) {
    if (fs.existsSync(toFile)) {
        fs.unlinkSync(toFile);
    }

    return await captureWebsite.file(`http://discordlog.homeserver3.poespas.me/user/${userID}/activity`, `${toFile}`, {
	launchOptions: {args: ['--no-sandbox', '--disable-setuid-sandbox']},
        delay: 7,
        width: 3840,
        height: 2160,
        element: ".activity-grid table",
	waitForElement: ".avatar:not([src=''])"
    });
}

module.exports = Activity;
