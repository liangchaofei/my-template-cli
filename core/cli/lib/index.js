'use strict';

module.exports = core;

const path = require('path')
const semver = require('semver');
const userHome = require('user-home');
const pathExists = require('path-exists').sync;
const colors = require('colors/safe');
const pkg = require('../package.json')
const log = require('@my-template-cli/log')
const init = require('@my-template-cli/init')
const exec = require('@my-template-cli/exec')
const commander = require('commander')
const costant = require('./const');


let args, config;

const program = new commander.Command()


async function core() {
    // TODO
    try{
        await prepare()
        registerCommand()
    }catch(error){
        log.error(error.message)
        if(program.debug){
            console.log(e)
        }
    }
}

// 命令注册
function registerCommand(){
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '是否开启调试模式', false)
        .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径','')
    

    // 初始化
    program
        .command('init [options]')
        .option('-f, --force', '是否强制初始化项目')
        .action(exec)

    // 开启debug
    program.on('option:debug', function(){
        if(program.debug){
            process.env.LOG_LEVEL = 'verbose'
        }else{
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL;
        log.verbose('test')
    })

    // 指定targetPath
    program.on('option:targetPath', function(){
        process.env.CLI_TARGET_PATH = program._optionValues.targetPath;
    })
    // 对未知命令监听
    program.on('command:*', function(obj){
        const availableCommand = program.commands.map(cmd => cmd.name());
        if(availableCommand.length > 0){
            console.log(colors.red('可用命令：' + availableCommand.join(',')))
        }
        console.log(colors.red('未知的命令：'+ obj[0]))
    })

 
    program.parse(process.argv)
    // 对没有输入命令的监听
    if(program.args && program.args.length < 1){
        program.outputHelp()
        console.log()
    }
}

async function prepare(){
    checkPkgVersion()
    checkNodeVersion()
    checktRoot()
    checkUserHome()
    checkEnv()
    await checkGlobalUpdate()
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
}

// 检查用户主目录
function checkUserHome(){
    if(!userHome || !pathExists){
        throw new Error(colors.red('当前登录用户主目录不存在!'))
    }
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
    // 3.获取最新的版本号，提示用户更新到该版本
    const lastVersions = await getNpmSemverVersion(currentVersion, npmName)
    if(lastVersions && semver.gt(lastVersions, currentVersion)){
        log.warn(colors.yellow(`请手动更新 ${npmName}， 当前版本：${currentVersion}，最新版本：${lastVersions}，更新命令：npm install -g ${npmName}`))
    }
}