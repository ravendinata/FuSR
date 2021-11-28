const chalk = require('chalk');
const fetch = require('node-fetch');
const clui = require('clui');
const Spinner = clui.Spinner;

// node-fetch option flags
const METHOD_GET = { method: "Get" };

// API URLs
const BASE_URL = "https://www.showroom-live.com";
const BASE_API_URL = "https://www.showroom-live.com/api";
const BASE_ONLIVE_API_URL = "https://www.showroom-live.com/api/live/onlives";

/**
 * Converts epoch (UNIX) time into formatted 24-hour time
 * @param epoch Epoch time to be converted
 */
function convertEpochTo24hr(epoch)
{
    var date = new Date(epoch * 1000); // Convert epoch to date format

    var hh = date.getHours();
    var mm = "0" + date.getMinutes();
    var ss = "0" + date.getSeconds();

    return hh + ':' + mm.substr(-2) + ':' + ss.substr(-2); 
}

// EXPORTED

async function getOnlive(param)
{
    const status = new Spinner(" > Fetching data...");
    status.start();

    fetch(BASE_ONLIVE_API_URL, METHOD_GET)
    .then(res => res.json())
    .then((json) =>
    {
        var data = json.onlives[0].lives;
        var r1 = data.filter(function(x)
        { return x.room_url_key.startsWith("akb48_"); })
        var r2 = data.filter(function(x)
        { return x.room_url_key.startsWith("48_"); })

        var result = r1.concat(r2);

        if (param != undefined)
        {
            var q1 = result.filter(function(x)
            { return x.room_url_key.toLowerCase().includes(param); })

            var q2 = result.filter(function(x)
            { return x.main_name.toLowerCase().includes(param); })

            result = q1.concat(q2);
            var set = new Set(result);
            result = Array.from(set);
        }

        status.stop();
        const roomCount = result.length;

        console.info("\n=== Streaming Now ===\n")

        const rows = [];
        for (let room = 0; room < roomCount; room++)
        {
            rows.push
            ({
                'Room Name': result[room].main_name,
                'Room ID': result[room].room_id,
                'URL': BASE_URL + '/' + result[room].room_url_key
            });
        }
        console.table(rows);

        console.info(`\n> ${roomCount} Members Streaming | Success!\n`);
    })
}

async function getRoomInfo(room_id)
{
    const endpoint = "/room/profile?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    const status = new Spinner(" > Fetching data...");
    status.start();

    fetch(BASE_API_URL + endpoint, METHOD_GET)
    .then(res => res.json())
    .then(json => 
    {
        status.stop();

        var isLive;
        var currStreamStart = convertEpochTo24hr(json.current_live_started_at);

        console.log(`> Fetch Check: ${json.main_name}`);

        if (json.main_name == undefined)
        {
            console.info(chalk.bgRed(`\nCannot find room with id = ${room_id}! Please check ID...\n`));
            return;
        }

        if (json.is_onlive == true)
            isLive = "Yes [Online]";
        else
        {
            isLive = "Not Streaming [Offline]";
            currStreamStart = isLive;
        }


        var rows = [];
        rows.push({'Property': 'Name', 'Value': json.main_name});
        rows.push({'Property': 'Room Level', 'Value': json.room_level});
        rows.push({'Property': 'Room ID', 'Value': json.room_id});
        rows.push({'Property': 'Follower', 'Value': json.follower_num});
        rows.push({'Property': 'Currently Streaming?', 'Value': isLive});
        rows.push({'Property': 'Current Stream Start Time', 'Value': currStreamStart});
        rows.push({'Property': 'Current Viewer', 'Value': json.view_num});

        console.table(rows);
        console.info('\n=== Room Description ===\n');
        console.info(json.description);
        console.info('\n');
    })
}

async function getStageUserList(room_id, n = 13)
{
    const endpoint = "/live/stage_user_list?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    const status = new Spinner(" > Fetching data...");
    status.start();

    fetch(BASE_API_URL + endpoint, METHOD_GET)
    .then(res => res.json())
    .then(json => 
    {
        status.stop();

        const data = json.stage_user_list;

        if (data[0] == null)
        {
            console.info(chalk.bgRed(`\ERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
            return;
        }

        var rows = [];

        for (let i = 0; i < n && i < 100; i++)
            rows.push({'Username': data[i].user.name, 'UID': data[i].user.user_id})

        console.table(rows);
    })
}

async function getStreamUrl(room_id)
{
    const endpoint = "/live/streaming_url?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    const status = new Spinner(" > Fetching data...");
    status.start();

    fetch(BASE_API_URL + endpoint, METHOD_GET)
    .then(res => res.json())
    .then(json => 
    {
        status.stop();
        
        const data = json.streaming_url_list;

        if (data[0] == null)
        {
            console.info(chalk.bgRed(`\ERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
            return;
        }

        let urlCount = data.length;
        var rows = [];

        for (let i = 0; i < urlCount; i++)
            rows.push({'Quality': data[i].label + ` [${data[i].quality}/${data[i].type}]`, 'URL': data[i].url})

        console.table(rows);
    })
}


/** ====================
 * * MODULE EXPORTS * * 
==================== **/

module.exports =
{
    getOnlive, 
    getRoomInfo,
    getStageUserList,
    getStreamUrl
}