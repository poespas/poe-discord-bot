const Axios = require("axios");

const Dorkcube = {
    DeleteEmote: "⛔",
    RedoEmote: "♻️",
    DeleteExpiry: 5 * 60 * 1000,

    Init: (client, actions) => {
        console.log("[ DORKCUBE ] Initialized");
        actions.RegisterCommand("!jerma", Dorkcube.OnMessageJerma);
    },
    OnMessageJerma: async (msg) => {
        let randomNum = Math.round(Math.random() * 10);

        let resp = await Axios({
            url: `https://dorkcu.be/ajax/getImages?page=${randomNum}`
        });

        let data = resp.data;

        if (data.error)
            msg.reply("I received an error from Dorkcube, woopsie??");

        let pageId = Math.round(Math.random() * (data.data.length-1));
        let images = [...data.data[pageId].matchAll(/href="(.*?)"/gi)];

        let photoId = Math.round(Math.random() * images.length);
        let randomImg = images[photoId-1][1];

        let picMsg = await msg.channel.send("https://dorkcu.be" + randomImg);

        let picReact = await picMsg.react(Dorkcube.DeleteEmote);
        let picReactRedo = await picMsg.react(Dorkcube.RedoEmote);

        picMsg.awaitReactions((r, u) => u.id == msg.author.id, { max: 1, time: Dorkcube.DeleteExpiry, errors: ['time'] })
            .then(collected => {
                const reaction = collected.first();

                if (reaction.emoji.name === Dorkcube.DeleteEmote) {
                    Dorkcube.OnRequestDelete(picMsg)
                }
                else if (reaction.emoji.name === Dorkcube.RedoEmote) {
                    Dorkcube.OnRequestRedo(picMsg, msg)
                }
            });

        // Remove react
        setTimeout(() => {
            picReact.remove();
            picReactRedo.remove();
         }, Dorkcube.DeleteExpiry);
    },
    OnRequestDelete: async (picMsg) => {
        picMsg.delete();
    },
    OnRequestRedo: async (picMsg, originalMsg) => {
        picMsg.delete();
        Dorkcube.OnMessageJerma(originalMsg);
    }
}

module.exports = Dorkcube;