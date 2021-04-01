const Version = {
    Actions: null,
    Init: (client, actions) => {
        Version.Actions = actions;

        console.log("[ VERSION ] Initialized");
        Version.Actions.RegisterCommand("!version", Version.OnMessageVersion);
    },
    OnMessageVersion: (msg) => {
        let currentVersion = Version.Actions.GetData("CurrentVersion") || 0;
        msg.reply(`We're running on v${new Date().getMonth()+3}.${Math.round(new Date().getDate() / 2)}.${currentVersion}`);

        Version.Actions.SetData("CurrentVersion", currentVersion + 1);
    }
}

module.exports = Version;