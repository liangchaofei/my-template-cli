'use strict';

const fs = require('fs');
const path = require('path')
const inquirer = require('inquirer')
const fse  = require('fs-extra')
const userHome = require('user-home')
const semver = require('semver')
const Command = require('@my-template-cli/command');
const Package = require('@my-template-cli/package');
const log = require('@my-template-cli/log')
const { spinnerStart, sleep } = require('@my-template-cli/utils')
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component'

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
            const projectInfo = await this.prepare()
            if(projectInfo){
                // 2.下载模版
                log.verbose('projectInfo',projectInfo)
                this.projectInfo = projectInfo;
                await this.downloadTemplate() 
                // 3.安装模版
            }
            
        }catch(e){
            console.log('aaa')
            log.error(e.message)
        }
    }

    async downloadTemplate(){
        // 1.通过项目模版api获取项目模版信息
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome,'.my-template-cli-dev','template')
        const storeDir = path.resolve(userHome,'.my-template-cli-dev','template', 'node_modules')
        console.log(targetPath,storeDir)
        const {npmName, version} = templateInfo;
        const templageNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version
        })
        console.log('templageNpm',templageNpm)
        if(! await templageNpm.exists()){
            const spinner = spinnerStart('正在下载模版...');
            await sleep()
            try{
                await templageNpm.install()
                log.success('下载模版成功')
            }catch(e){
                throw e
            } finally{
                spinner.stop(true)
            }
    
           
        }else{

            const spinner = spinnerStart('正在更新模版...');
            await sleep()
            try{
                await templageNpm.update();
                log.success('更新模版成功')
            }catch(e){
                throw e
            } finally{
                spinner.stop(true)
            }
        }
        // 1.1 通过egg.js搭建一套后端系统
        // 1.2 通过npm存储项目模版
        // 1.3 将项目模版信息存储到mongodb数据库中
        // 1.4 通过egg.js获取mongdb的数据并通过api返回
    }
    async prepare(){
        // 0. 判断项目模版是否存在
        const template = await getProjectTemplate();
        console.log(template)
        if(!template || template.length === 0){
            throw new Error('模版不存在')
        }
        this.template = template;
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
       }
       return this.getProjectInfo()
    }

    async getProjectInfo(){
        let projectInfo = {};
        // 1.选择创建项目或组件
        const { type } = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: TYPE_PROJECT,
            choices: [{
                name: '项目',
                value: TYPE_PROJECT
            },{
                name: '组件',
                value: TYPE_COMPONENT
            }]
        })
        if(type === 'project'){
            // 2.获取项目的基本信息
            const project = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: '请输入项目名称',
                    default: '',
                    validate: function (v) {
                        const done = this.async();
                        // 1.首字符必须为英文字符
                       // 2.尾字符必须为英文或数字，不能为字符
                       // 3.字符仅允许"-_"
                       setTimeout(function() {
                           if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])$/.test(v)) {
                               done('请输入合法的项目名称');
                               return;
                           }
                           done(null, true);
                       }, 0);
                    },
                    filter: function (v) {
                        return v;
                    }
                },{
                    type: 'input',
                    name: 'projectVersion',
                    message: '请输入项目版本号',
                    default: '1.0.0',
                    validate: function (v) {
                        const done = this.async();
                        setTimeout(function() {
                            if (!(!!semver.valid(v))) {
                                done('请输入合法的项目名称');
                                return;
                            }
                            done(null, true);
                        }, 0);
                    },
                    filter: function (v) {
                        if(!!semver.valid(v)){
                            return semver.valid(v)
                        }else{
                            return v;
                        }
                    }
                },{
                    type: 'list',
                    name: 'projectTemplate',
                    message: '请选择项目模版',
                    choices: this.createTemplateChoices()
                }
            ])
            console.log('aaa',project)
            projectInfo = {
                type,
                ...project
            }
        }else if(type === 'component'){

        }
        return projectInfo;
    }
    isDirEmpty(localPath){
        let fileList = fs.readdirSync(localPath);
        fileList = fileList.filter(file => !file.startsWith('.') && ['node_modules'].indexOf(file)<0)
        return !fileList || fileList.length <=0;
    }
    createTemplateChoices(){
        return this.template.map(item => ({
            value: item.npmName,
            name: item.name
        }))
    }
}

function init(argv) {
    // TODO
    return new InitCommand(argv)
}
module.exports = init;
module.exports.InitCommand = InitCommand;