const CONFIG = require('../config.json');
const chalk = require('chalk');
const fs = require('fs');
const util = require('./commonUtils.js');

const clui = require('clui');
const Spinner = clui.Spinner;

async function summarizeLiveRanking(path)
{
    var ranking;

    try 
    { 
        if (fs.existsSync(path))
            ranking = require(path);
        else if (fs.existsSync(CONFIG.dumpFolder_liveRanking + path))
            ranking = require(CONFIG.dumpFolder_liveRanking + path);
        else if (fs.existsSync(CONFIG.dumpFolder_liveRanking + path + '.json'))
            ranking = require(CONFIG.dumpFolder_liveRanking + path + '.json');
        else
            throw new Error("Cannot find specified file!");
    }
    catch(ex) { return console.info(chalk.bgRed(`\n${ex}\n`)); }

    var spinner = new Spinner('Summarizing Live Ranking...');
    spinner.start();

    const rows = [];
    for (let rank = 0; rank < ranking.length; rank++)
    {
        rows.push
        ({
            'Username': ranking[rank].user.name,
            'UID': ranking[rank].user.user_id,
            'Point': ranking[rank].point
        })
    }

    let updateTime = util.convertEpochTo24hr(ranking[0].updated_at);

    spinner.stop();
    console.info(`\n=== Live Ranking as of ${updateTime} ===`);
    console.table(rows);
}

module.exports =
{
    summarizeLiveRanking,
}