const chalk = require('chalk');
const fetch = require('node-fetch');
const fs = require('fs');
const clui = require('clui');
const Spinner = clui.Spinner;
const { JSDOM } = require("jsdom");

// node-fetch option flags
const METHOD_GET = { method: "Get" };

// API URLs
const BASE_URL = "https://www.showroom-live.com";
const BASE_API_URL = "https://www.showroom-live.com/api";
const BASE_TIMETABLE_API_URL = "https://www.showroom-live.com/api/time_table/time_tables";
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

function getGiftInfo(search_param)
{
    const dataSource = require('../gift_list.json');
    const data = dataSource.normal;
    
    var id_search = data.filter(function(x)
    { return x.gift_id === Number(search_param); });
    
    var string_search;
    try
    {
        string_search = data.filter(function(x)
        { return x.gift_name.toLowerCase().includes(search_param.toLowerCase()); });
    }
    catch(ex){}
    
    var item = id_search.concat(string_search);

    return item;
}

function getGiftPoint(gift_id) { try { return getGiftInfo(gift_id)[0].point } catch(ex) {}; }

async function getAPI(url)
{
    const response = await fetch(url, METHOD_GET);
    return await response.json();
}

async function roomIDtoURLKey(room_id)
{
    const result = await getAPI(`https://www.showroom-live.com/api/room/profile?room_id=${room_id}`);
    return await result.room_url_key;
}

/*
    EXPORTED
*/

async function getOnlive(param)
{
    const status = new Spinner(" > Fetching data...");
    
    status.start();
    var json = await getAPI(BASE_ONLIVE_API_URL);
    status.stop()

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

    const roomCount = result.length;

    if (roomCount == 0)
    {
        console.info(chalk.bgHex('#e05600')("\nNo members are live streaming.\n"));
        return;
    }

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
      
    console.info("\n=== Streaming Now ===\n");
    console.table(rows);
    console.info(`\n> ${roomCount} Members Streaming | Success!\n`);
}

async function getRoomInfo(room_id)
{
    const status = new Spinner(" > Fetching data...");
    const endpoint = "/room/profile?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);
    
    status.start();
    var json = await getAPI(BASE_API_URL + endpoint);
    status.stop();

    console.log(`> Fetch Check: ${json.main_name}`);

    // ROOM DOES NOT EXIST
    if (json.main_name == undefined)
    {
        console.info(chalk.bgRed(`\nCannot find room with id = ${room_id}! Please check ID...\n`));
        return;
    }

    // ROOM FOUND
    var isLive;
    var currStreamStart = convertEpochTo24hr(json.current_live_started_at);

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

    status.stop();

    console.table(rows);
    console.info('\n=== Room Description ===\n');
    console.info(json.description);
    console.info('\n');
}

// Stage Related

async function getStageUserList(room_id, n = 13)
{
    const status = new Spinner(" > Fetching data...");
    const endpoint = "/live/stage_user_list?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    status.start();
    var result = await getAPI(BASE_API_URL + endpoint);
    status.stop();
    
    var data = result.stage_user_list;

    if (data[0] == null)
    {
        console.info(chalk.bgRed(`\nERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
        return;
    }

    var rows = [];
    for (let i = 0; i < n && i < 100; i++)
        rows.push({'Username': data[i].user.name, 'UID': data[i].user.user_id});

    console.table(rows);
}

async function getLiveRanking(url_key, n = 13, dump = false)
{
    const status = new Spinner(" > Fetching data...");
    var key = url_key;

    if (!isNaN(url_key))
        key = await roomIDtoURLKey(url_key);

    console.info(`\n=== DEBUG @ API Fetch ===\n> URL Key: ${key}`);

    status.start();
    const dom = await JSDOM.fromURL(`https://www.showroom-live.com/${key}`, { resources:"usable", runScripts: "dangerously" })
    const node = dom.window.document.getElementById('js-live-data');
    const json = JSON.parse(node.getAttribute("data-json"));
    const ranking = json.ranking.live_ranking;
    dom.window.close();
    status.stop();

    if (ranking[0] == null)
    {
        console.info(chalk.bgRed(`\nERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
        return;
    }

    const rows = [];
    for (let rank = 0; rank < n && rank < ranking.length; rank++)
    {
        rows.push
        ({
            // 'Ranking': ranking[rank].order_no,
            'Username': ranking[rank].user.name,
            'UID': ranking[rank].user.user_id,
            'Point': ranking[rank].point
        })
    }

    let updateTime = convertEpochTo24hr(ranking[0].updated_at);
    
    console.info(`\n=== Live Ranking as of ${updateTime} ===`);
    console.table(rows);

    if (dump == true)
    {
        let odata = JSON.stringify(ranking, null, 4);
        fs.writeFileSync('live_ranking.json', odata);
        console.info(chalk.bgBlueBright("\nDumping Done!\n"));
    }
}

async function searchStage(room_id, search_param)
{
    if (search_param == '')
    {
        console.info(chalk.bgRed(`\nERROR! No search parameter entered!\n`));
        return;
    }

    const status = new Spinner(" > Fetching data...");
    const endpoint = "/live/stage_user_list?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    status.start();
    var result= await getAPI(BASE_API_URL + endpoint);
    status.stop();

    var data = result.stage_user_list;

    if (data[0] == null)
    {
        console.info(chalk.bgRed(`\nERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
        return;
    }

    var id_search = data.filter(function(x) { return x.gift_id === Number(search_param); });

    try
    {
        var string_search = data.filter(function(x)
        { return x.user.name.toLowerCase().includes(search_param.toLowerCase()); });
    }
    catch(ex) {}

    var user = id_search.concat(string_search);
    var rows = [];

    for (let i = 0; i < user.length; i++)
    {
        rows.push
        ({
            'Username': user[i].user.name, 
            'UID': user[i].user.user_id,
            'Rank': user[i].rank
        });
    }

    console.table(rows);
}

async function getStreamUrl(room_id)
{
    const status = new Spinner(" > Fetching data...");
    const endpoint = "/live/streaming_url?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    status.start();
    var result = await getAPI(BASE_API_URL + endpoint);
    status.stop();

    var data = result.streaming_url_list;

    if (data == null)
    {
        console.info(chalk.bgRed(`\nERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
        return;
    }

    let urlCount = data.length;

    var rows = [];
    for (let i = 0; i < urlCount; i++)
        rows.push({'Quality': data[i].label + ` [${data[i].quality}/${data[i].type}]`, 'URL': data[i].url})

    console.table(rows);
}

// Gift Related

async function getGiftable(room_id, dump)
{
    const status = new Spinner(" > Fetching data...");
    const endpoint = "/live/gift_list?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    status.start();
    var json = await getAPI(BASE_API_URL + endpoint);    
    status.stop();

    var data = json.normal;

    if (dump == true)
    {
        let odata = JSON.stringify(json, null, 4);
        fs.writeFileSync('gift_list.json', odata);
        console.info(chalk.bgBlueBright("\nDumping Done!\n"));
        return;
    }

    if (data[0] == null)
    {
        console.info(chalk.bgRed(`\nERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
        return;
    }

    let items = data.length;
    console.info(`\n${items} items giftable in this room\n`);

    var rows = [];
    for (let i = 0; i < items; i++)
    {
        rows.push
        ({
            'Gift Name': data[i].gift_name, 
            'Gift ID': data[i].gift_id,
            'Image URL': data[i].image,
            'Point': data[i].point,
            'Free?': data[i].free
        });
    }

    console.table(rows);
}

async function getGiftLog(room_id)
{
    const status = new Spinner(" > Fetching data...");
    const endpoint = "/live/gift_log?room_id=" + room_id;

    console.info(`\n=== DEBUG @ API Fetch ===\n> API Endpoint: ${BASE_API_URL + endpoint}`);

    status.start();
    var json = await getAPI(BASE_API_URL + endpoint);
    status.stop();
    
    const data = json.gift_log;

    if (data[0] == null)
    {
        console.info(chalk.bgRed(`\nERROR! Either ID is invalid or room is not currently streaming! Please check ID or try again later...\n`));
        return;
    }

    let items = data.length;
    
    var rows = [];
    for (let i = 0; i < items; i++)
    {
        var gift_name = '';
        try
        {
            gift_name = getGiftInfo(data[i].gift_id)[0].gift_name;
        }
        catch(ex) {}

        rows.push
        ({
            'Gifter Name': data[i].name, 
            'Gifter ID': data[i].user_id,
            'Gift Name': gift_name,
            'Gift ID': data[i].gift_id,
            'Time Gifted': convertEpochTo24hr(data[i].created_at),
            'Quantity': data[i].num,
            'Total Point': data[i].num * Number(getGiftPoint(data[i].gift_id))
        });
    }

    console.table(rows);
}

function searchGift(search_param)
{
    const status = new Spinner(" > Fetching data...");
    
    status.start();
    var items = getGiftInfo(search_param);
    status.stop();
    
    var rows = [];
    for (let row = 0; row < items.length; row++)
    {
        rows.push
        ({
            'Gift Name': items[row].gift_name,
            'Gift ID': items[row].gift_id,
            'Point': items[row].point,
            'Free?': items[row].free
        });
    }
    
    console.table(rows);
}

// Timetable Related

async function getTimetable()
{
    const status = new Spinner(" > Fetching data...");
    
    status.start();
    var json = await getAPI(BASE_TIMETABLE_API_URL);
    status.stop();
    
    var data = json.time_tables;
    var result = data.filter(function(x)
    { return x.room_url_key.startsWith("48_"); })

    const scheduledCount = result.length;

    if (scheduledCount == 0)
    {
        status.stop();
        console.info(chalk.bgHex('#e05600')("\nNo members scheduled a stream.\n"));
        return;
    }

    const rows = [];
    for (let room = 0; room < scheduledCount; room++)
    {
        rows.push
        ({
            'Room Name': result[room].main_name,
            'Room ID': result[room].room_id,
            'URL': BASE_URL + '/' + result[room].room_url_key
        });
    }
    
    console.info("\n=== Timetable Schedules ===\n");
    console.table(rows);
    console.info(`\n> ${scheduledCount} Timetable Schedules | Success!\n`);
}

async function getScheduled(param)
{
    const status = new Spinner(" > Fetching data...");
    
    status.start();
    var json = await getAPI(BASE_API_URL + "/live/upcoming?genre_id=102");
    status.stop();
    
    var data = json.upcomings;

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

    const roomCount = result.length;

    if (roomCount == 0)
    {
        status.stop();
        console.info(chalk.bgHex('#e05600')("\nNo members scheduled a live stream.\n"));
        return;
    }

    const rows = [];
    for (let room = 0; room < roomCount; room++)
    {
        rows.push
        ({
            'Room Name': result[room].main_name,
            'Room ID': result[room].room_id,
            'Next Live': convertEpochTo24hr(result[room].next_live_start_at),
            'URL': BASE_URL + '/' + result[room].room_url_key
        });
    }
    
    console.info("\n=== Scheduled Streams ===\n");
    console.table(rows);
    console.info(`\n> ${roomCount} Schedulued Streams | Success!\n`);
}

/** ====================
 * * MODULE EXPORTS * * 
==================== **/

module.exports =
{
    getOnlive, 
    getRoomInfo,
    getStageUserList,
    getLiveRanking,
    getStreamUrl,
    getGiftable,
    getGiftLog,
    getTimetable,
    getScheduled,

    searchGift,
    searchStage,
}
