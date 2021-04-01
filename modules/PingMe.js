const PingMe = {
    Client: null,
    Init: (client, actions) => {
        PingMe.Client = client;

        console.log("[ PINGME ] Initialized");
        actions.RegisterCommand(`<@!${PingMe.Client.user.id}>`, PingMe.OnPingMe, true);
    },
    OnPingMe: async (msg) => {
        msg.reply("Ye pinged me?");
    }
}

module.exports = PingMe;