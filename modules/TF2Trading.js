const fs = require("fs");

let msgusers = {};

const TF2Trading = {
    Init: (client, actions) => {
        console.log("[ TF2TRADING ] Initialized");
        actions.RegisterCommand("!mvm", TF2Trading.OnMessageProfit);
        actions.RegisterCommand("!trades", TF2Trading.OnMessageTrades);
    },
    OnMessageProfit: async (msg) => {
        if (!fs.existsSync("/tf2-bot/data/storage.json")) {
            msg.channel.send("I currently lack critical information. ( <@!127424279083089920> )");
        }

        let config = JSON.parse(fs.readFileSync("/tf2-bot/data/config.json"));

        const profit = getProfit(config);
        const keyProfit = (profit / config.key_price);
        msg.channel.send(`Profit in the last 30 days is: ${(profit / 9).toFixed(2)} refined, that is about ${(keyProfit * 2).toFixed(2)} MvM tickets, thats enough for ${(keyProfit * 2).toFixed(2)} (${(keyProfit * 2).toFixed(2)}) players!`);
    },
    OnMessageTrades: async (msg) => {
        const messageText = msg.content;
        const args = messageText.split(" ");
        const command = args.shift() ?? "";
        let storageJson = JSON.parse(fs.readFileSync("/tf2-bot/data/storage.json"));

        if (args[0] == undefined) {
            msg.channel.send(`Usage: !trades [number]`)
            return;
        }

        const numberOfTrades = parseInt(args[0]);
        if (isNaN(numberOfTrades)) {
            msg.channel.send(`Argument 1 must be of type number`);
            return;
        }
        if (numberOfTrades > storageJson.length) {
            msg.channel.send(`Number is bigger than the total trades that are currently available, try a smaller number`);
            return;
        }

        const filter = findParameterValue(args, "filter");
        const page = findParameterValue(args, "page") ?? 1;
        const search = findParameterValue(args, "search", "string") ?? "";
        const returnMessage = getRecentTrades(numberOfTrades, filter, page, search);
        if (returnMessage.length > 2000) {
            msg.channel.send(`Returned message is too big, try a smaller number`);
            return;
        }
        msg.channel.send(returnMessage);
    }
}

module.exports = TF2Trading;

function getProfit(config) {
    // outputItems is currently not used but will be in the future (hopefully)
    const outputItems = [];

    const ts = ~~(Date.now() / 1000) - 60 * 60 * 24 * 30;
    let totalProfit = 0;

    let storageJson = JSON.parse(fs.readFileSync("/tf2-bot/data/storage.json"));
    let keyprice = config.key_price;

    for (let i = 0; i < storageJson.length; i++) {
        const tradeDataItem = storageJson[i];
        if (tradeDataItem.intent != 0) continue;
        for (let j = i + 1; j < storageJson.length; j++) {
            const tradeDataItem2 = storageJson[j];
            if (tradeDataItem2.assetid != tradeDataItem.assetid) continue;
            if (tradeDataItem2.intent != 1) continue;
            if (tradeDataItem2.time < ts) break;
            const pushItem = new TradeDataItem(tradeDataItem, tradeDataItem2, keyprice);
            totalProfit += pushItem.sellProfit;
            outputItems.push(pushItem);
            break;
        }
    }

    return totalProfit;
}

function findParameterValue(arguments, searchingFor, returnType = "number"){

    if (arguments.indexOf(searchingFor) >= 0){
        if (arguments[arguments.indexOf(searchingFor) + 1]) value = arguments[arguments.indexOf(searchingFor) + 1]; else return null;
        
        if (returnType == "number" && !isNaN(parseInt(value))) return parseInt(value);
        if (returnType == "string") return value;
    }
    
    return null;
}

function getRecentTrades(numberOfTrades, filterByIntent = null, pageNumber = 1, searchFor = "") {
    let storageJson = JSON.parse(fs.readFileSync("/tf2-bot/data/storage.json")).reverse();

    const tradesData = [];
    let maxNameSize = "Name".length;
    let maxPriceSize = "Price".length;
    let skipped = 0;

    for (let i = 0; i < storageJson.length; i++) {
        const item = storageJson[i];

        if (filterByIntent !== null && item.intent !== filterByIntent) {
            continue;
        }

        if (!item.name.toLowerCase().includes(searchFor.toLowerCase())) continue;

        skipped++; //pagination
        if (skipped < ((pageNumber * numberOfTrades) - numberOfTrades) + 1) continue;

        if (numberOfTrades <= tradesData.length) {
            break;
        }

        maxNameSize = Math.max(maxNameSize, item.name.length);
        maxPriceSize = Math.max(maxPriceSize, stringPrice(item.price).length);
        let item2;
        for (let j = i; j < storageJson.length && item.intent == 1; j++) {
            const itemBuy = storageJson[j];
            if (item.assetid != itemBuy.assetid) continue;
            if (itemBuy.intent != 0) continue;
            item2 = itemBuy;
            break;
        }
        if (item2 == undefined) {
            tradesData.push(new HistoryTradeDataItem(this.storage, item));
            continue;
        }

        tradesData.push(new HistoryTradeDataItem(this.storage, item, item2));
    }

    let returnString = `⬛|${"Name".padEnd(maxNameSize)}|${"Price".padEnd(maxPriceSize)}|Profit\n`;
    tradesData.forEach((item) => {
        returnString += `${item.intent ? "🟩" : "🟦"}|`;
        returnString += `${item.name.padEnd(maxNameSize)}|`;
        returnString += `${stringPrice(item.price).padEnd(maxPriceSize)}|`;
        returnString += `${item.profit ?? ""}\n`;
    })
    returnString += `page ${pageNumber} ${filterByIntent == null ? "" : filterByIntent == 0 ? "| filter: buy " : "| filter: sell "}${searchFor == null || searchFor == "" ? "" : "| search: " + searchFor}\n`;

    return "```\n" + returnString + "```\n \🟦 = buy, \🟩 = sell";
}

function stringPrice(price) {
    return `${price.keys} Keys, ${(price.scrap / 9).toFixed(2)} Ref`;
}

class TradeDataItem {
    name;
    sellTime;
    sellProfit;
    price;
    constructor(dataBuy, dataSell, keyprice = 1000) {
        this.name = dataBuy.name;
        this.sellTime = ~~(dataSell.time - dataBuy.time);
        const totalBuyPrice = dataBuy.price.keys * keyprice + dataBuy.price.scrap;
        const totalSellPrice = dataSell.price.keys * keyprice + dataSell.price.scrap;
        this.sellProfit = totalSellPrice - totalBuyPrice;
        this.price = dataBuy.price;
    }
}

class HistoryTradeDataItem {
    name;
    price;
    steamid;
    intent;
    profit;
    constructor(storage, item, item2 = undefined) {
        let variables = JSON.parse(fs.readFileSync("/tf2-bot/data/variables.json"));
        this.name = item.name;
        this.price = item.price;
        this.steamid = item.steamid;
        this.intent = item.intent;
        if (item2 == undefined) return;

        const totalSellPrice = item.price.keys * variables.key_price + item.price.scrap;
        const totalBuyPrice = item2.price.keys * variables.key_price + item2.price.scrap;

        this.profit = totalSellPrice - totalBuyPrice;
    }
}
