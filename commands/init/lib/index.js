'use strict';

const fs = require('fs');
const inquirer = require('inquirer')
const fse  = require('fs-extra')
const Command = require('@my-template-cli/command');
const log = require('@my-template-cli/log')
class InitCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force == !!this.cmd.force;
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    async exec(){
        try{
            // 1.准备阶段
            const ret = await this.prepare()
            if(ret){
                // 2.下载模版
                // 3.安装模版
            }
            
        }catch(e){
            log.error(e.message)
        }
    }
    async prepare(){
        const localPath = process.cwd(); // 获取当前目录
        // 1.判断当前目录是否为空
       if(!this.isDirEmpty(localPath)){
        let ifContinue = false;
        if(!this.force){
            // 是否继续创建
            ifContinue = (await inquirer.prompt({
                type: 'confirm',
                name: 'ifContinue',
                message: '当前文件不为空，是否继续创建项目',
                default: false
            })).ifContinue;
            if(!ifContinue) return;
        }
        
        console.log(ifContinue)
        if(ifContinue || this.force){
            // 给用户做二次确认
            const {confirmDelete}=await inquirer.prompt({
                type: 'confirm',
                name: 'confirmDelete',
                message: '确认是否清空当前目录下所有文件'
            }) 
            // 2.是否启动强制更新
            if(confirmDelete){
                // 清空当前目录
                fse.emptyDirSync(localPath)
            }
        }
       }else{
            // 3.选择创建项目或组件
            // 4.获取项目的基本信息
       }
        
    }
    isDirEmpty(localPath){
        let fileList = fs.readdirSync(localPath);
        fileList = fileList.filter(file => !file.startsWith('.') && ['node_modules'].indexOf(file)<0)
        return !fileList || fileList.length <=0;
    }

}

function init(argv) {
    // TODO
    return new InitCommand(argv)
}
module.exports = init;
module.exports.InitCommand = InitCommand;