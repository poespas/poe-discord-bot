const Twitch = require("./Twitch");

const Sawdust = {
    Client: null,
    Actions: null,
    Init: (client, actions) => {
        Sawdust.Client = client;
        Sawdust.Actions = actions;

        console.log("[ SAWDUST ] Initialized");
        actions.RegisterCommand(`!sawdust`, Sawdust.OnSawdust, true, true);

        // Events
        client.on('message', Sawdust.OnSawdustMessage);
    },
    OnSawdust: async (msg) => {
        let past_messages = Twitch.Actions.GetData("sawdust_messages") || [];

        let i = Math.round(Math.random() * past_messages.length);
        let coolmsg = past_messages[i];

        msg.reply(coolmsg)
    },
    OnSawdustMessage: async (msg) => {
        if (msg.author.bot) return;

        if (msg.author.id != '427698800572760074')
            return;

        if (msg.content.startsWith("!") || msg.content == "")
            return;

        let past_messages = Twitch.Actions.GetData("sawdust_messages") || [];
        past_messages.push(msg.content);

        past_messages = past_messages.slice(Math.max(past_messages.length - 500, 0));
        Twitch.Actions.SetData("sawdust_messages", past_messages);
    }
}

module.exports = Sawdust;