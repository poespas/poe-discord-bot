const tmi = require('tmi.js');
const moment = require('moment-timezone');

const config = require("../config.json");

const twitch = new tmi.Client({
	connection: {
		reconnect: true,
		secure: true
	},
	identity: {
		"username": config.twitch.username,
        "password": config.twitch.password
	},
	channels: config.twitch.channelsw
});

let listening = false;

let days = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
];

const Twitch = {
    Actions: null,
    Client: null,

    Init: (client, actions) => {
        Twitch.Actions = actions;
        Twitch.Client = client;

        console.log("[ TWITCH ] Initialized");
        actions.RegisterCommand("!sus", Twitch.OnMessageSus, false, true);

        // Twitch
        twitch.connect()
            .catch(console.error);

        twitch.on('message', (channel, tags, message, self) => {
            if(self) return;

            if(message.toLowerCase() === '!sus') {
                listening = true;
                console.log("[ TWITCH ] Getting new sus");
            }

            if(tags['display-name'] === 'Nightbot' && listening) {
                listening = false;
                Twitch.Actions.SetData("CurrentSus", message);
            }
        });
    },
    OnMessageSus: (msg) => {
        let CurrentSus = Twitch.Actions.GetData("CurrentSus");
        if (!CurrentSus)
            return msg.reply("Please try again in a few minutes.");

        let ts = detectTimezone(CurrentSus);

        if (!ts) 
            return msg.reply(CurrentSus);
        
        let wordStart = [...CurrentSus.matchAll(new RegExp(' ', 'gi'))].map(a => a.index+1);
        
        let start = wordStart.filter(i => i < ts.indexAt);
            start = start[start.length-1];

        let end = wordStart.filter(i => i >= ts.indexAt)[0];

        let timeStr = CurrentSus.substring(start, end-1);

        let reg = /(\d*[:]?\d*)[ ]?(am|pm)/.exec(timeStr);

        if (!reg[1].includes(":"))
            reg[1] += ":00";

        moment.tz.setDefault(ts.ts);
        let time = moment(reg[1], "hh:mm");

        if (reg[2].includes("pm"))
            time = time.add(12, 'hours');

        let currentDay = moment().day();

        for (let i = 0; i < days.length; i++) {
            const day = days[i];

            if (CurrentSus.toLowerCase().includes(day)) {
                let nextDay = i;

                if (currentDay > nextDay)
                    nextDay += 7;

                time.day(nextDay);
            }
        }

        let reply = CurrentSus;

        if (time.isValid())
            reply += `\nWhich is in ${time.fromNow()}! 🎉`;

        msg.reply(reply);
    }
}

module.exports = Twitch;

function detectTimezone(str) {
    let timezones = {
        "America/Los_Angeles": [
            "Pacific",
            "PST",
            "PT"
        ]
    };

    for (const tsKey in timezones) {
        if (timezones.hasOwnProperty(tsKey)) {
            const tsArr = timezones[tsKey];
            
            for (let i = 0; i < tsArr.length; i++) {
                const tsKeyword = tsArr[i];
                if (str.includes(tsKeyword))
                    return { ts: tsKey, indexAt: str.indexOf(tsKeyword) };
            }
        }
    }

    return null;
}