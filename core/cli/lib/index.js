'use strict';

module.exports = core;

const semver = require('semver');
const colors = require('colors/safe');
const pkg = require('../package.json')
const log = require('@my-template-cli/log')
const costant = require('./const');
function core() {
    // TODO
    try{
        checkPkgVersion()
        checkNodeVersion()
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
    console.log(process.version)
    const currentVersion = process.version;
    // 第二步，获取最低版本号
    const lowestVersion = costant.LOWEST_NODE_VERSION;
    console.log('lowestVersion',lowestVersion)
    // 第三步，使用semver库进行比对
    if(!semver.gte(currentVersion,lowestVersion)){
        throw new Error(colors.red(`my-template-cli 需要安装 ${lowestVersion} 以上版本的 Node.js`))
    }
}