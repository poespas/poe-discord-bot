const Discord = require('discord.js');
const fs = require("fs");
const config = require("./config.json");

const client = new Discord.Client();

const Modules = {
    Activity: require("./modules/Activity"),
    Ping: require("./modules/Twitch"),
    Dorkcube: require("./modules/Dorkcube"),
    Version: require("./modules/Version"),
    PingMe: require("./modules/PingMe"),
    Sawdust: require("./modules/Sawdust"),
    TextTransformation: require("./modules/TextTransformation"),
    TF2Trading: require("./modules/TF2Trading")
};

if (!fs.existsSync("./data.json")) {
    console.log(`Creating data.json`);
    fs.writeFileSync("./data.json", JSON.stringify({}));
}

let Commands = { };
let CommandsHide = [ ];
let CommandsAllowAnywhere = [ ];

const Controller = {
    RegisterCommand: (command, handler, hide = false, allowAnywhere = false) => {
        console.log(`[ CONTROL ] Registering command ${command}`);
        Commands[command] = handler;

        if (hide)
            CommandsHide.push(command);

        if (allowAnywhere)
            CommandsAllowAnywhere.push(command);
    },
    SetData: (key, data) => {
        let db = JSON.parse(fs.readFileSync("./data.json"));
        db[key] = data;
        fs.writeFileSync("./data.json", JSON.stringify(db));
    },
    GetData: (key) => {
        let db = JSON.parse(fs.readFileSync("./data.json"));
        return db[key];
    },
    ListCommands: (client) => {
        let resp = `current commands are: \`\`\``;
        
        let commands = Object.keys(Commands).filter(i => !CommandsHide.includes(i));
        commands = commands.sort();
        resp += commands.map(i => `- ${i}`).join("\n");
        
        resp += "```\nFor feature requests, and other inquiries, please contact our support agent Zachary Kaczmarek.";
        client.reply(resp);
    }
}

client.on('ready', () => {
    console.log(`[ CONTROL ] Logged in as ${client.user.tag}!`);

    for (const handlerName in Modules) {
        if (Modules.hasOwnProperty(handlerName)) {
            const module = Modules[handlerName];
            module.Init(client, Controller);
        }
    }
    
    // Framework commands
    Controller.RegisterCommand("!list", Controller.ListCommands);
});


// Events
client.on('message', async msg => {
    if (msg.author.bot) return;

    for (const command in Commands) {
        if (Commands.hasOwnProperty(command)) {
            const handler = Commands[command];

            if (msg.content.startsWith(command)) {
                if (msg.channel == "714079088498704458" && !CommandsAllowAnywhere.includes(command))
                    return msg.reply("Please go to <#719256167989379142>");

                console.log(`[ CONTROL ] Executing command "${command}"`);

                handler(msg);
            }
        }
    }
});

client.login(config.discord.token);
