'use strict';
const Package = require('@my-template-cli/package')
const log = require('@my-template-cli/log')
const path = require('path')
const cp = require('child_process')

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
            // 在当前进程中调用
            // require(rootFile).call(null,Array.from(arguments))
            // node子进程中调用
            const args = Array.from(arguments);
            const cmd = args[args.length - 1];
            const o = Object.create(null);
            Object.keys(cmd).forEach(key => {
                if(cmd.hasOwnProperty(key) && !key.startsWith('_')&&key!=='parent'){
                    o[key] = cmd[key]
                }
            })
            args[args.length - 1] = o;
            const code = `require('${rootFile}').call(null,${JSON.stringify(args)})`;
            const child = spawn('node',['-e',code],{
                cwd: process.cwd,
                stdio: 'inherit'
            })
            child.on('error',err=>{
                log.verbose(err.message)
                process.exit(1)
            })
            child.on('exit',e=>{
                log.verbose('命令执行成功：'+ e)
                process.exit(e)
            })
        }catch(err){
            log.error(err.message)
        }
    }
   
}

function  spawn(command,args,options) {
    const win32 = process.platform === 'win32'

    const cmd = win32 ? 'cmd': command;
    const cmdArgs = win32 ? ['/c'].concat(command,args):args;
    return cp.spawn(cmd,cmdArgs,options || {})
}
module.exports = exec;
