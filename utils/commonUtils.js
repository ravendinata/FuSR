/**
 * Converts epoch (UNIX) time into formatted 24-hour time
 * @param epoch Epoch time to be converted
 */
function convertEpochTo24hr(epoch, delimiter = ":")
{
    var date = new Date(epoch * 1000); // Convert epoch to date format

    var hh = date.getHours();
    var mm = "0" + date.getMinutes();
    var ss = "0" + date.getSeconds();

    return hh + delimiter + mm.substr(-2) + delimiter + ss.substr(-2);
}

module.exports =
{
    convertEpochTo24hr,
}