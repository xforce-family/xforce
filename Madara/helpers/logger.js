const chalk = require('chalk');
const header = 'NongView';

const getCtx = (ctx) => { return (ctx !== null) ? header + ':' + ctx : header };

function logInfo(msg, context = null) {
    let ctx = getCtx(context);
    console.log(chalk.blue(`[${ctx}]`) + ' ' + msg);
}

function logOk(msg, context = null) {
    let ctx = getCtx(context);
    console.log(chalk.green(`[${ctx}]`) + ' ' + msg);
}

function logWarn(msg, context = null) {
    let ctx = getCtx(context);
    console.log(chalk.yellow(`[${ctx}]`) + ' ' + msg);
}

function logError(msg, context = null) {
    let ctx = getCtx(context);
    console.log(chalk.red(`[${ctx}]`) + ' ' + msg);
}

module.exports = {
    logInfo,
    logOk,
    logWarn,
    logError
}