const Discord = require('discord.js');
const bot = new Discord.Client();
const config = require('./config.json');

const PREFIX = '$';
const version = '1.1';

// LIZZY MASTER LIST
var masterList = [];

// Setup
bot.on('ready', () => {
    console.log('Lizzy at your service!');
    bot.user.setPresence({
        status: 'online',
        activity: {
            name: 'to $help',
            type: 'LISTENING',
        }
    })
});

bot.on('message', message => {
    // Args is the command (1 word) after the PREFIX command
    let args = message.content.substring(PREFIX.length).split(" ");

    switch (args[0]) {
        case 'test':
            message.channel.send('success!');
            break;
        case 'info':
            if (args[1] === 'version') {
                message.channel.send("Version " + version);
            } else if (args[1] === 'author') {
                message.channel.send("Programmed by: Ferrero");
            } else {
                message.channel.send('That is not a valid command!');
                message.channel.send('Check out "$info version"' +
                    ' or "$info author"');
            }
            break;
        case 'add':
            // addSomething(mesasge, args);
            if (args[1].toLowerCase() === 'list') {
                addNewList(message, args);
            } else if (addNewItemParameterIsValid(message, args)) {
                addNewItemToAList(message, args);
            } else {
                message.channel.send('Invalid command!');
                message.channel.send('Use "$add list" to add new list');
                message.channel.send('Check out "$help add" for more information how to add a list or item');
            }
            break;
        case 'see':
            seeStuff(message, args);
            break;
        case 'remove':
            if (userRemoveAList(args)) {
                performRemoveList(message, args);
            } else if (userRemoveItem(message, args)) {
                performRemoveItem(message, args);
            } else {
                message.channel.send('Invalid argument');
                message.channel.send('See "$help remove" for more information on' +
                    ' how to remove stuff');
            }
            break;
        case 'help':
            giveHelp(message, args);
            break;
    }
});

/**
 * Give help instructions
 * 
 * @param {*} message the message that requests help
 * @param {*} args the arguments
 */
function giveHelp(message, args) {
    if (args.length === 1) {
        // message.channel.send('Ask Lizzy to:');
        sendHelpAdd(message);
        sendHelpSee(message);
        sendHelpRemove(message);
    } else if (args[1] === 'add') {
        sendHelpAdd(message);
    } else if (args[1] === 'see') {
        sendHelpSee(message);
    } else /*if (args[2] === 'remove')*/ {
        sendHelpRemove(message);
    }
}

/**
 * Send help command of adding list and items.
 * 
 * @param {*} message the message that requested for help
 */
function sendHelpAdd(message) {
    const embed = new Discord.MessageEmbed()
        .setTitle('Commands to add list and items:')
        .setColor('GREY')
        .addField('`$add list xxxx`', 'To add list named xxxx to the server')
        .addField('`$add N xxxx`', 'To add item xxxx to list number N');

    message.channel.send(embed);
}

/**
 * Send help command to see lists and items in the list
 * 
 * @param {*} message the message that requested for help
 */
function sendHelpSee(message) {
    const embed = new Discord.MessageEmbed()
        .setTitle('Commands to see list and items:')
        .setColor('GREY')
        .addField('`$see list`', 'To see all lists in the server')
        // .addField('`$see list xxxx`', 'To see list with title xxxx')
        .addField('`$see list N`', 'To see list with number N');

    message.channel.send(embed);
}

/**
 * 
 * @param {*} message the message that requested for help
 */
function sendHelpRemove(message) {
    const embed = new Discord.MessageEmbed()
        .setTitle('Commands to remove list and items:')
        .setColor('GREY')
        .addField('`$remove list xxxx`', 'To remove list named xxxx if there is one')
        // .addField('`$see list xxxx`', 'To see list with title xxxx')
        .addField('`$remove list N`', 'To remove list number N')
        .addField('`$remove N M`', 'To remove item number M in list number N');

    message.channel.send(embed);
}

/**
 * Check if the user wants to remove an item based on the argument passed in
 * 
 * @param {*} args user argument
 */
function userRemoveItem(message, args) {
    if (args.length === 3 && listExist(args[1]) && itemExist(args[1], args[2])) {
        return true;
    } else {
        message.channel.send('List or items might not be available');
        if (!listExist(args[1])) {
            sendEntireList(message);
        } else {
            sendSpecificList(message, args[1]);
        }
        return false;
    }
}

/**
 * Remove an item if the user is authorized to that item. 
 * 
 * @param {*} message user message that requested to remove an item from the list
 * @param {*} args user argument
 */
function performRemoveItem(message, args) {
    if (userAuthorizedItem(message, args[1], args[2])) {
        // Item removal
        let listName = masterList[args[1] - 1].listTitle;
        let itemName = masterList[args[1] - 1].items[parseInt(args[2]) - 1].name;

        masterList[args[1] - 1].items.splice(parseInt(args[2]) - 1, 1);
        sendItemRemovalConfirmation(message, listName, itemName);
    } else {
        message.reply('You are not the creator of the item or the list');
    }
}

function sendItemRemovalConfirmation(message, listName, itemName) {
    const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setTitle('An item has been removed from ' + listName)
        .setDescription(message.author.username + " has removed " + itemName + " from " + listName);

    message.channel.send(embed);
}

/**
 * Check if the user is authorized to remove the item.
 * User is authorized to remove an item if:
 * 1) They are the creator of the list
 * 2) They are the creator of the item within that list
 * 
 * @param {*} message user message that requested to remove list
 * @param {*} listNum the list index number that suppose to contain the itemNum
 * @param {*} itemNum the itemNum to be removed
 */
function userAuthorizedItem(message, listNum, itemNum) {
    let requesterID = message.author.id;
    let list = masterList[parseInt(listNum) - 1];
    return (requesterID === list.listAuthor.id || requesterID == list.items[parseInt(itemNum) - 1].itemAuthor.id)
}

/**
 * Check if the list exists on this server based on user argument
 * 
 * @param {*} listNum the list number
 */
function listExist(listNum) {
    return parseInt(listNum) >= 1 && parseInt(listNum) <= masterList.length;
}

/**
 * Check if the item exists in the given list number
 * 
 * @param {*} listNum a number argument that represents the item number
 * @param {*} itemNum the item number in the list
 */
function itemExist(listNum, itemNum) {
    return (listExist(listNum) && parseInt(itemNum) >= 1 && masterList[listNum - 1].items.length >= parseInt(itemNum));
}

/**
 * Identify if user is removing a list
 * 
 * @param {*} args user argument
 */
function userRemoveAList(args) {
    return (args.length >= 3 && args[1].toLowerCase() === 'list');
}

/**
 * Removes a list from the server
 * 
 * @param {*} message user message that requested to remove list
 * @param {*} args the argument the user give
 */
function performRemoveList(message, args) {
    if (args.length === 3 && (parseInt(args[2]) <= masterList.length && parseInt(args[2]) >= 1)) {
        if (checkUSerAuthorized(message, args[2] - 1)) {
            let listTitle = masterList[args[2] - 1].listTitle;
            masterList.splice(args[2] - 1, 1);
            sendListRemovalSuccess(message, listTitle);
        }
    } else {
        let listTitleToRemove = '';
        for (let i = 2; i < args.length; i++) {
            listTitleToRemove += args[i] + " ";
        }

        if (titleListExist(listTitleToRemove) > -1) {
            let listIndexToRemove = titleListExist(listTitleToRemove);
            if (checkUSerAuthorized(message, listIndexToRemove)) {
                masterList.splice(listIndexToRemove, 1);
                sendListRemovalSuccess(message, listTitleToRemove);
            }
        } else {
            message.channel.send('List not found or does not exist!');
            message.channel.send('See "$help remove" for more information on' +
                ' how to remove stuff');
        }
    }
}

/**
 * Send approval of removing a list
 * 
 * @param {*} message the message that removes the list
 * @param {*} listTitle the title of the list removed
 */
function sendListRemovalSuccess(message, listTitle) {
    const embed = new Discord.MessageEmbed()
        .setColor('RANDOM')
        .setTitle('A list has been removed')
        .setDescription(message.author.username + ' has removed ' + listTitle + 'from this server')
        .setFooter('Type in "$see" to see the current available list');

    message.channel.send(embed);
}

/**
 * Check if this user is the creator of the list.
 * 
 * @param {*} message the message that requested removal
 * @param {*} listIndexToRemove the index of the list to be removed
 */
function checkUSerAuthorized(message, listIndexToRemove) {
    if (message.author.id === masterList[listIndexToRemove].listAuthor.id) {
        return true;
    } else {
        message.reply("You are not the creator of " +
            masterList[listIndexToRemove].listTitle + "list.");
        return false;
    }
}

/**
 * Check if there is a matching list title to in the master list
 * 
 * @param {*} listTitleRemove  the title of the list to be removed
 * @returns the position of the list in the master list. If does not exist, it returns -1
 */
function titleListExist(listTitleRemove) {
    let counter = 0;
    while (counter < masterList.length) {
        if (masterList[counter].listTitle.toLowerCase() === listTitleRemove.toLowerCase()) {
            return counter;
        }
        counter++;
    }
    return -1;
}

/**
 * Add a new list to the master list
 * 
 * @param {*} message the message of the command.
 * @param {*} args word-by-word argument
 */
function addNewList(message, args) {
    if (args.length === 2) {
        message.channel.send('Please enter a Title for the list');
        message.channel.send('Type in "$help add" for more information');
    } else {
        let title = '';
        for (let i = 2; i < args.length; i++) {
            title += args[i] + " ";
        }

        title = title.charAt(0).toUpperCase() + title.substring(1);

        /*
        Title --> the title of thes list
        Author --> The creator of the list
        Items --> The stuff that is added under this list
        */
        let thisListData = {
            'listTitle': title,
            'listAuthor': message.author,
            'items': []
        };

        masterList.push(thisListData);
        // console.log(masterList);
        performAddListConfirmation(message, title);
    }
}

/**
 * Send approval of new list has been added
 * 
 * @param {*} message the message that adds the new list to the server
 * @param {*} title the title of the newly added list
 */
function performAddListConfirmation(message, title) {
    let author = message.author.username;
    const confimrationEmbed = new Discord.MessageEmbed()
        .setColor('PINK')
        .setTitle('A new list has been added to this server')
        .setDescription(author + ' has added ' + title + 'list to this server');

    message.channel.send(confimrationEmbed);
}

/**
 * Add new item to a list
 * 
 * @param {*} message Discord.Message object (the calling command)
 * @param {*} args the user argument
 */
function addNewItemToAList(message, args) {
    if (parseInt(args[1]) > masterList.length || parseInt(args[1]) < 0) {
        message.channel.send('You are adding to an invalid list number');
        sendEntireList(message);
    } else {
        let item = '';
        for (let i = 2; i < args.length; i++) {
            item += args[i] + ' ';
        }

        item = item.charAt(0).toUpperCase() + item.substring(1);

        let itemData = {
            'name': item,
            'itemAuthor': message.author
        };

        masterList[args[1] - 1].items.push(itemData);

        let title = masterList[args[1] - 1].listTitle;
        performAddItemConfirmation(message, title, item);
    }
}

/**
 * Check if the user command to add an item in a list is valid.
 * 
 * @param {*} args the argument the user passsed in.
 */
function addNewItemParameterIsValid(message, args) {
    // return (args.length >= 3 && '123456789'.includes(args[1]));
    if (args.length >= 3 && parseInt(args[1]) >= 1 && parseInt(args[1]) <= masterList.length) {
        return true;
    } else {
        message.channel.send('List number may not exist');
        sendEntireList(message);
    }
}

/**
 * Send successful confirmation of item removal
 * 
 * @param {*} message the message that removes the item
 * @param {*} title the title of the list in which the item is located
 * @param {*} item the item that has been removed
 */
function performAddItemConfirmation(message, title, item) {
    let author = message.author.username;
    const confimrationEmbed = new Discord.MessageEmbed()
        .setColor('ORANGE')
        .setTitle('A new item has been added to this server')
        .setDescription(author + ' has added ' + item + ' to ' + title);

    message.channel.send(confimrationEmbed);
}

/**
 * To see the "stuff". Where stuff includes;
 * <li>A master list</li>
 * <li>A list with specific items</li>
 * 
 * @param {*} message the message of the command.
 * @param {*} args word-by-word argument
 */
function seeStuff(message, args) {
    if (userSeeEntireList(args)) {
        sendEntireList(message);
    } else if (userSeeSpecificList(message, args)) {
        sendSpecificList(message, args[2]);
    } else {
        message.channel.send('That is not a valid command.')
        message.channel.send('Type in "$help see" for more information');
    }
}

/**
 * Check if user want to see the entire list based on the command argument.
 * 
 * @param {*} args the user argument.
 */
function userSeeEntireList(args) {
    return args.length === 1 || (args.length === 2 && args[1] === 'list');
}

/**
 * Check if user want to see a specific list based on the command argument.
 * 
 * @param {*} args the user argument.
 */
function userSeeSpecificList(message, args) {
    // return args.length === 3 && args[1] === 'list' && '123456789'.includes(args[2]);
    if (args.length === 3 && args[1] === 'list' && parseInt(args[2]) >= 1 &&
        parseInt(args[2]) <= masterList.length) {
        return true;
    } else {
        message.channel.send('Invalid list number');
        sendEntireList(message);
    }
}

/**
 * Send the entire title of the masterlist and provide instructions to
 * see the list items.
 * 
 * @param {*} message the message of the command.
 */
function sendEntireList(message) {
    const masterListEmbed = new Discord.MessageEmbed()
        .setTitle('Available List Titles in This Server:')
        .setColor('RANDOM');

    if (masterList.length === 0) {
        masterListEmbed.setTitle('There are no list in this server yet.')
        masterListEmbed.setDescription('Start adding list by using the command' +
            '"$add" followed by the list name.');
        masterListEmbed.setFooter('Or type in "$help add" to see how it can be done');
    } else {
        for (let i = 0; i < masterList.length; i++) {
            let text = JSON.stringify(masterList[i]);
            let json = JSON.parse(text);
            let tempTitle = json.listTitle;
            masterListEmbed.addField('List ' + (i + 1) + ':', tempTitle);
            masterListEmbed.setDescription('To see items in a specific list, type in' +
                '"$see list #", where # is the number of the list that you want to see');
        }
    }
    message.channel.send(masterListEmbed);
}

/**
 * 
 * @param {*} message 
 * @param {*} args 
 */
function sendSpecificList(message, args) {
    // if (parseInt(args) > masterList.length || parseInt(args) <= 0) {
    //     message.channel.send('Invalid list number');
    //     sendEntireList(message);
    // } else {
    // console.log(masterList[args - 1].items);
    let theList = "`";
    theList += masterList[args - 1].listTitle + ":\n";

    let items = masterList[args - 1].items;
    if (items.length == 0) {
        theList += "\nThere are no items in this list yet";
        theList += '\nUse "$add ' + args + '" followed by the item to add items to this list';
    } else {
        for (let i = 0; i < items.length; i++) {
            theList += "\n" + (i + 1) + ") " + items[i].name;
        }
    }
    theList += "`";

    message.channel.send(theList);
}

bot.login(config.token);