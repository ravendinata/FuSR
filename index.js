#!/usr/bin/env node

const CONFIG = require('./config.json');
const prompt = require('prompt-sync')({sigint: true});
const chalk = require('chalk');
const figlet = require('figlet');

const sr = require('./utils/showroomHelper.js');
const df = require('./utils/dumpFileHelper.js');

const options =
`General Functions:
1. Onlive
2. Event Timetable
3. Scheduled Streams
4. Room Info
5. Giftable Items List

Streaming Functions:
10. Live Ranking
11. Search Stage 
12. Stream URL List
13. Gift Log

FuSRpedia & Utilities:
20. Search Gift
21. Convert Room ID to URL Key
22. Convert URL Key to Room ID
30. Summarize Live Ranking

Enter '111' to redo the last action.

Enter '99' to CLEAR the screen.
Enter '0', nothing (blank), or simply Ctrl + C to EXIT.`;

var lastRoomKey = '';
var lastOption = 0;
var lastParam = 0;
var quickRedo = false;

function printLogo()
{
    if (CONFIG.logo_skip)
        return;

    console.info
    (
        chalk.hex(CONFIG.logo_colour)
        (
            figlet.textSync("FuSR", { horizontalLayout: 'full', font: 'ANSI Shadow'})
        )
    );
}

function promptRoomHistory()
{
    if (quickRedo)
        return lastRoomKey;

    if (CONFIG.history_noPrompt)
        return prompt("Room ID or URL Key: ");

    var confirmation = 'n';
                    
    if (lastRoomKey != '')
        confirmation = prompt(`Do you want to use the last room key [${lastRoomKey}]? (y/n/<new key>): `);
    
    if (confirmation == 'n')
        lastRoomKey = prompt("Room ID or URL Key: ");
    else if (confirmation == 'y' || confirmation == '') 
        console.info(chalk.bgBlueBright(`\nUsing stored key: ${lastRoomKey}`));
    else
    {
        console.info(chalk.bgBlueBright(`\nUsing new key: ${confirmation}`));
        return confirmation;
    }
    
    return lastRoomKey;
}

function promptParam(message)
{
    if (quickRedo)
        return lastParam;

    var param = prompt(message);
    lastParam = param;

    return param;
}

/* MAIN */
console.clear();
console.info('\nNOTE: This utility is best used in maximized window.\n');
printLogo();

(async () => 
    {
        var status = "Running";
        var skip = false;

        while(status == "Running")
        {
            console.info("====================");
            console.info(options);
            console.info("====================");
            var opt = Number(prompt("Choose Function: "));

            if (opt == 111)
            {
                opt = lastOption;
                quickRedo = true;
            }

            switch (opt)
            {
                // General Functions
                case 1:
                    var filter = promptParam("Enter filter: ");
                    await sr.getOnlive(filter);
                    break;
                
                case 2:
                    await sr.getTimetable();
                    break;
                
                case 3:
                    var filter = promptParam("Enter filter: ");
                    await sr.getScheduled(filter);
                    break;

                case 4: 
                    var room_key = promptRoomHistory();
                    await sr.getRoomInfo(room_key);
                    break;

                case 5:
                    var room_key = promptRoomHistory();
                    await sr.getGiftable(room_key, false);
                    break;

                // Streaming Functions
                case 10:
                    var room_key = promptRoomHistory();
                    var dispNum = promptParam("Users to display (0 to n; Default = 13): ");

                    if (dispNum < 1)
                        dispNum = 13;

                    await sr.getLiveRanking(room_key, dispNum);
                    break;

                case 11:
                    var room_key = promptRoomHistory();
                    var param = promptParam("Search name: ");
                    await sr.searchStage(room_key, param);
                    break;

                case 12:
                    var room_key = promptRoomHistory();
                    await sr.getStreamUrl(room_key);
                    break;

                case 13:
                    var room_key = promptRoomHistory();
                    await sr.getGiftLog(room_key);
                    break;

                // FuSRPedia and Utilities
                case 20:
                    var param = promptParam("Gift ID or Name (Empty = All): ");
                    await sr.searchGift(param);
                    break;

                case 21:
                    var param = promptParam("Enter Room ID: ");
                    var res = await sr.roomIDtoURLKey(param);
                    console.info(`Room ID -> URL Key: ${res}`);
                    break;

                case 22:
                    var param = promptParam("Enter URL Key: ");
                    var res = await sr.urlKeyToRoomID(param);
                    console.info(`URL Key -> Room ID: ${res}`);
                    break;

                // Dump File Functions
                case 30:
                    console.info('\nEnter the path or name of ranking dump file.\nIf using file name, the file should be inside directory specified in the config file.\n');
                    var path = promptParam('File Name or Path: ');
                    await df.summarizeLiveRanking(path);
                    break;

                // 'Secret' Options
                case 485:
                    var room_key = promptRoomHistory();
                    await sr.getGiftable(room_key, true);
                    break;

                case 4810:
                    var room_key = promptRoomHistory();
                    await sr.getLiveRanking(room_key, 100, true);
                    break;

                case 0:
                    status = "Quit";
                    console.info("\nExitting...\n");
                    break;

                case 99:
                    skip = true;
                    console.clear();
                    console.info(chalk.bgBlueBright(chalk.whiteBright("\nConsole cleared!\n")));
                    printLogo();
                    break;

                default:
                    skip = true;
                    console.info("\nOption not found!\n");
                    break;
            }

            lastOption = opt;
            quickRedo = false;

            if (status == "Running")
            {   
                if (!skip)
                    prompt("Press enter to continue...\n");

                skip = false;
            }

            if (CONFIG.setting_autoClearAfterCommand)
                console.clear();
        }
    }
) ()