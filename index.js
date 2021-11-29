#!/usr/bin/env node

const prompt = require('prompt-sync')({sigint: true});
const sr = require('./utils/showroomHelper.js');
const chalk = require('chalk');
const figlet = require('figlet');

const options =
`General Functions:
1. Onlive
2. Room Info

Streaming Functions:
3. Stage User List
4. Search Stage 
5. Stream URL List
6. Giftable Items List
7. Gift Log

FuSRpedia:
10. Search Gift`;


/* MAIN */
console.info('\n');
console.info
(
    chalk.hex('#d049f2')
    (
        figlet.textSync("FuSR", { horizontalLayout: 'full', font: 'ANSI Shadow'})
    )
);

console.info(options);
console.info("====================");
var opt = Number(prompt("Choose Function: "));

switch (opt)
{
    case 1:
        var filter = prompt("Enter filter: ");
        sr.getOnlive(filter);
        break;
    
    case 2: 
        var room_id = prompt("Room ID: ");
        sr.getRoomInfo(room_id);
        break;
    
    case 3:
        var room_id = prompt("Room ID: ");
        var dispNum = prompt("Users to display (0 to n; Default = 13): ");
        if (dispNum < 1)
            dispNum = 13;
        sr.getStageUserList(room_id, dispNum);
        break;

    case 4:
        var room_id = prompt("Room ID: ");
        var param = prompt("Search name: ");
        sr.searchStage(room_id, param);
        break;

    case 5:
        var room_id = prompt("Room ID: ");
        sr.getStreamUrl(room_id);
        break;

    case 6:
        var room_id = prompt("Room ID: ");
        sr.getGiftable(room_id, false);
        break;

    case 7:
        var room_id = prompt("Room ID: ");
        sr.getGiftLog(room_id);
        break;

    case 10:
        var param = prompt("Gift ID or Name (Empty = All): ");
        sr.searchGift(param);
        break;

    // 'Secret' Options

    case 486:
        var room_id = prompt("Room ID: ");
        sr.getGiftable(room_id, true);
        break;

    default:
        console.info("\nOption not found! Exitting...\n");
        break;
}