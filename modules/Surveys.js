const timezones = require("../data/timezones.json");
const Profile = require("../lib/Profile");

/*
    OPTION_TIMEZONE
    OPTION_ALLOW_REMIND
*/

const Surveys = {
    Client: null,
    Actions: null,

    command: {},

    Init: (client, actions) => {
        Surveys.Client = client;
        Surveys.Actions = actions;

        console.log("[ SURVEYS ] Initialized");
        actions.RegisterCommand("!setup", Surveys.OnMessageSetup);

        // Events
        client.on('message', Surveys.OnMessage);
    },

    OnMessage: async (msg) => {
        const channelid = msg.channel.id;
        const userid = msg.author.id;

        if (msg.content === "!setup") {
            return;
        }
        
        if (Surveys.command[userid] && Surveys.command[userid].listening === channelid) {
            console.log(`Answer for step ${Surveys.command[userid].step} would be "${msg.content}"`);

            Surveys.OnMessageSetup(msg, msg.content);
        }
    },

    OnMessageSetup: async (msg, answer = null) => {
        const channelid = msg.channel.id;
        const userid = msg.author.id;

        const user = await Profile.GetUser(userid);

        if (user) {
            return msg.reply("We see you already have a profile setup, you cannot setup a new profile at this time.");
        }

        if (!Surveys.command[userid]) {
            Surveys.command[userid] = {
                step: "OPTION_TIMEZONE",
                listening: true,
                current_question: "",
                steps: {}
            }
        }

        // What timezone are you in? ( Please use <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> )
        if (Surveys.command[userid].step === "OPTION_TIMEZONE") {
            if (answer !== null) {
                let timezone = Surveys.ParseTz(answer);

                if (timezone == null) {
                    await msg.reply("Answer incorrect, please try again.");
                    
                    return await Surveys.SendQuestion(channelid, userid, "OPTION_TIMEZONE", Surveys.command[userid].current_question);
                }

                Surveys.SetAnswer(userid, Surveys.command[userid].step, timezone);
                Surveys.command[userid].step = "OPTION_ALLOW_REMIND";
                answer = null;
            }
            else {
                return await Surveys.SendQuestion(
                    channelid,
                    userid,
                    "OPTION_TIMEZONE",
                    "1. What timezone are you in? ( Please use <https://en.wikipedia.org/wiki/List_of_tz_database_time_zones> )"
                );
            }
        }

        // Would you like us to remind you of any questions/surveys we have?
        if (Surveys.command[userid].step === "OPTION_ALLOW_REMIND") {
            if (answer !== null) {
                answer = answer.toLowerCase().includes("y");

                Surveys.SetAnswer(userid, Surveys.command[userid].step, answer);

                Surveys.command[userid].step = "FINAL"; // Thanks
                answer = null;
            }
            else {
                return await Surveys.SendQuestion(
                    channelid,
                    userid,
                    "OPTION_ALLOW_REMIND",
                    "2. Would you like us to remind you of any questions/surveys we have?"
                );
            }
        }
        
        if (Surveys.command[userid].step === "FINAL") {
            await msg.reply("That was all, thank you, saving..");

            await Profile.SetUser(userid);

            for (const stepId in Surveys.command[userid].steps) {
                if (Object.hasOwnProperty.call(Surveys.command[userid].steps, stepId)) {
                    const step = Surveys.command[userid].steps[stepId];
                    
                    Profile.SetOption(userid, stepId, JSON.stringify(step.answer));
                }
            }

            delete Surveys.command[userid];
        }
    },

    SendQuestion: async (channelId, userId, stepId, question) => {
        Surveys.command[userId].step = stepId;
        Surveys.command[userId].listening = channelId;
        Surveys.command[userId].current_question = question;
        Surveys.command[userId].steps[stepId] = {
            stepId,
            question,
            answer: null
        };

        const channel = Surveys.Client.channels.cache.get(channelId);
        channel.send(`<@${userId}> ${question}`);
    },

    SetAnswer: (userid, questionId, answer) => {
        Surveys.command[userid].steps[questionId].answer = answer;
    },

    ParseTz: (input) => {
        input = input.toLowerCase();

        for (let i = 0; i < timezones.length; i++) {
            const tz = timezones[i];
            
            if (tz.abbr.toLowerCase() === input) {
                return tz;
            }

            let item = tz.utc.filter( i =>  i.toLowerCase() == input );
            if (item.length != 0) {
                return tz;
            }
        }

        return null;
    }
}

module.exports = Surveys;