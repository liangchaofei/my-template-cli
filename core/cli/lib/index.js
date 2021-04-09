'use strict';

module.exports = core;

const path = require('path')
const semver = require('semver');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const colors = require('colors/safe');
const pkg = require('../package.json')
const log = require('@my-template-cli/log')
const costant = require('./const');


let args, config;

async function core() {
    // TODO
    try{
        checkPkgVersion()
        checkNodeVersion()
        checktRoot()
        checkUserHome()
        checkInputArgs()
        log.verbose('debug', 'test debug')
        checkEnv()
        await checkGlobalUpdate()
    }catch(error){
        log.error(error.message)
    }
}

// 检查版本号
function checkPkgVersion(){
    log.notice('cli',pkg.version)
}

// 检查node版本号
function checkNodeVersion(){
    // 第一步，检查当前node版本号
    const currentVersion = process.version;
    // 第二步，获取最低版本号
    const lowestVersion = costant.LOWEST_NODE_VERSION;
    // 第三步，使用semver库进行比对
    if(!semver.gte(currentVersion,lowestVersion)){
        throw new Error(colors.red(`my-template-cli 需要安装 ${lowestVersion} 以上版本的 Node.js`))
    }
}

// 检查root启动
function checktRoot(){
    const rootCheck = require('root-check');
    rootCheck()
    console.log(process.geteuid()) 
}

// 检查用户主目录
function checkUserHome(){
    if(!userHome || !pathExists){
        throw new Error(colors.red('当前登录用户主目录不存在!'))
    }
}
// 检查入参,是否debug模式
function checkInputArgs(){
    const minimist = require('minimist')
    args = minimist(process.argv.slice(2));
    checkArgs()
}
function checkArgs(){
    if(args.debug){
        process.env.LOG_LEVEL = 'verbose'
    }else{
        process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL;
}

// 检查环境变量
function checkEnv(){
    const dotenv = require('dotenv')
    const dotenvPath = path.resolve(userHome, '.env');
    if(pathExists(dotenvPath)){
        dotenv.config({
            path: dotenvPath
        });
    }
    config = createDefaultConfig()
  
    log.verbose('环境变量', process.env.CLI_HOME_PATH)
}
function createDefaultConfig(){
    const cliConfig = {
        home: userHome
    }
    if(process.env.CLI_HOME){
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    }else{
        cliConfig['cliHome'] = path.join(userHome, constants.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

// 检查是否全局更新
async function checkGlobalUpdate(){
    // 1.获取当前版本号和模块名
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    // 2.调用npm api，获取所有版本号
    const { getNpmSemverVersion } = require('@my-template-cli/get-npm-info')
    const lastVersions = await getNpmSemverVersion(currentVersion, npmName)
    if(lastVersions && semver.gt(lastVersions, currentVersion)){
        log.warn(colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersions}，更新命令：npm install -g ${npmName}`))
    }
    // 3.提取所有版本号，比对哪些版本号是大于当前版本号
    // 4.获取最新的版本号，提示用户更新到该版本
}