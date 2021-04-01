const TextTransformation = {
    Actions: null,
    Init: (client, actions) => {
        TextTransformation.Actions = actions;

        console.log("[ VERSION ] Initialized");
        TextTransformation.Actions.RegisterCommand("!ol", TextTransformation.OnMessageOmegalul, true, true);
    },
    OnMessageOmegalul: (msg) => {
        if (msg.author.id != '127424279083089920')
            return;

        // msg.delete();

        let input = msg.content;
            input = input.replace("!ol", "");

        let emote = "<:OMEGALUL:806003901522247730>";

        let output = input.replace(/o/gi, emote);
        msg.channel.send(output);
    }
}

module.exports = TextTransformation;