#!/usr/bin/env node

const prompt = require('prompt-sync')({sigint: true});
const sr = require('./utils/showroomHelper.js');
const chalk = require('chalk');
const figlet = require('figlet');

const options =
`Options:
1. Onlive
2. Room Info
3. Stage User List
4. Stream URL List`;


/* MAIN */
console.log
(
    chalk.hex('#d049f2')
    (
        figlet.textSync("FuSR", { horizontalLayout: 'full', font: 'ANSI Shadow'})
    )
);

console.info(options);
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
        sr.getStreamUrl(room_id);
        break;

    default:
        console.info("\nOption not found! Exitting...\n");
        break;
}