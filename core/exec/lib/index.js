'use strict';
const Package = require('@my-template-cli/package')
const log = require('@my-template-cli/log')
const path = require('path')

const SETTINGS = {
    init: '@@my-template-cli/init'
}
const CACHE_DIR = 'dependencies'
async function exec() {
    let storeDir = '';
    let pkg = '';
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj.name(); // 获取 init这个名称
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';

    if(!targetPath){
        targetPath = path.resolve(homePath, CACHE_DIR) // 生成缓存路径
        storeDir = path.resolve(targetPath,'node_modules')
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion
        });
        if(await pkg.exists()){
            // 更新package
            console.log('更新package')
            await pkg.update();
        }else{
            // 安装package
            await pkg.install();
        }
    }else{
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion
        });
    }
    const rootFile = pkg.getRootFilePath();
    if(rootFile){
        try{
            require(rootFile).call(null,Array.from(arguments))
        }catch(err){
            log.error(err.message)
        }
    }
   
}

module.exports = exec;
