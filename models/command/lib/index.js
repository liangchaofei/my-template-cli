'use strict';

const semver = require('semver');
const colors = require('colors/safe');
const LOWEST_NODE_VERSION = '12.0.0';

class Command{
    constructor(argv){
        console.log('command',argv)
        this._argv = argv;
        let runner = new Promise((resolve,reject) => {
            let chain = Promise.resolve();
            chain = chain.then(() => this.checkNodeVersion())
        })
    }
    // 检查node版本号
    checkNodeVersion(){
        // 第一步，检查当前node版本号
        const currentVersion = process.version;
        // 第二步，获取最低版本号
        const lowestVersion = LOWEST_NODE_VERSION;
        // 第三步，使用semver库进行比对
        if(!semver.gte(currentVersion,lowestVersion)){
            throw new Error(colors.red(`my-template-cli 需要安装 ${lowestVersion} 以上版本的 Node.js`))
        }
    }

    init(){
        throw new Error('init必须实现')
    }
    exec(){
        throw new Error('exec必须实现')
    }
}
module.exports = Command;