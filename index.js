#!/usr/bin/env node

const prompt = require('prompt-sync')({sigint: true});
const sr = require('./utils/showroomHelper.js');
const chalk = require('chalk');
const figlet = require('figlet');

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

Enter '99' to CLEAR the screen.
Enter '0', nothing (blank), or simply Ctrl + C to EXIT.`;

function printLogo()
{
    console.info
    (
        chalk.hex('#d049f2')
        (
            figlet.textSync("FuSR", { horizontalLayout: 'full', font: 'ANSI Shadow'})
        )
    );
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

            switch (opt)
            {
                // General Functions
                case 1:
                    var filter = prompt("Enter filter: ");
                    await sr.getOnlive(filter);
                    break;
                
                case 2:
                    await sr.getTimetable();
                    break;
                
                case 3:
                    var filter = prompt("Enter filter: ");
                    await sr.getScheduled(filter);
                    break;

                case 4: 
                    var room_key = prompt("Room ID or URL Key: ");
                    await sr.getRoomInfo(room_key);
                    break;

                case 5:
                    var room_key = prompt("Room ID or URL Key: ");
                    await sr.getGiftable(room_key, false);
                    break;

                // Streaming Functions
                case 10:
                    var room_key = prompt("Room ID or URL Key: ");
                    var dispNum = prompt("Users to display (0 to n; Default = 13): ");
                    if (dispNum < 1)
                        dispNum = 13;
                    await sr.getLiveRanking(room_key, dispNum);
                    break;

                case 11:
                    var room_key = prompt("Room ID or URL Key: ");
                    var param = prompt("Search name: ");
                    await sr.searchStage(room_key, param);
                    break;

                case 12:
                    var room_key = prompt("Room ID or URL Key: ");
                    await sr.getStreamUrl(room_key);
                    break;

                case 13:
                    var room_key = prompt("Room ID or URL Key: ");
                    await sr.getGiftLog(room_key);
                    break;

                // FuSRPedia
                case 20:
                    var param = prompt("Gift ID or Name (Empty = All): ");
                    await sr.searchGift(param);
                    break;

                case 21:
                    var param = prompt("Enter Room ID: ")
                    var res = await sr.roomIDtoURLKey(param);
                    console.info(`Room ID -> URL Key: ${res}`);
                    break;

                case 22:
                    var param = prompt("Enter URL Key: ")
                    var res = await sr.urlKeyToRoomID(param);
                    console.info(`URL Key -> Room ID: ${res}`);
                    break;

                // 'Secret' Options
                case 485:
                    var room_key = prompt("Room ID: ");
                    await sr.getGiftable(room_key, true);
                    break;

                case 4810:
                    var room_key = prompt("Room ID or URL Key: ");
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

            if (status == "Running")
            {   
                if (!skip)
                    prompt("Press enter to continue...\n");

                skip = false;
            }
        }
    }
) ()