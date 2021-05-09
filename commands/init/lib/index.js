'use strict';

const fs = require('fs');
const path = require('path')
const inquirer = require('inquirer')
const fse  = require('fs-extra')
const ejs = require('ejs');
const glob = require('glob');
const userHome = require('user-home')
const semver = require('semver')
const Command = require('@my-template-cli/command');
const Package = require('@my-template-cli/package');
const log = require('@my-template-cli/log')
const { spinnerStart, sleep, execAsync } = require('@my-template-cli/utils')
const getProjectTemplate = require('./getProjectTemplate')

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component'

const TEMPLATE_TYPE_NORMAL = 'normal';
const TEMPLATE_TYPE_CUSTOM = 'custom';

const WHITE_CMD = ['npm', 'cnpm']

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
                await this.installTemplate()
            }
            
        }catch(e){
            log.error(e.message)
            if(process.env.LOG_LEVEL === 'verbose'){
                console.log(e)
            }
        }
    }
    async installTemplate(){
        if(this.templateInfo){
            if(!this.templateInfo.type){
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL
            }
            if(this.templateInfo.type === TEMPLATE_TYPE_NORMAL){
                // 标准安装
                await this.installNormalTemplate()
            }
            else if(this.templateInfo.type === TEMPLATE_TYPE_CUSTOM){
                // 自定义安装
                await this.installCustomTamplate()
            }else{
                throw new Error('无法识别项目模版类型!')
            }
        }else{
            throw new Error('项目模版信息不存在!')
        }
    }

    checkCommand(cmd){
        if(WHITE_CMD.includes(cmd)){
            return cmd;
        }
        return null;
    }

    async execCommand(command,errMsg){
        let ret;
        if(command){
            const cmdArray = command.split(' ');
            const cmd = this.checkCommand(cmdArray[0]);
            if(!cmd){
                throw new Error('命令不存在，命令：', + command)
            }
            const args = cmdArray.slice(1)
            ret = await execAsync(cmd,args,{
                stdio: 'inherit',
                cwd: process.cwd()
            })
        }
        if(ret !==0){
            throw new Error(errMsg)
        }
        return ret;
    }

    async ejsRender(options){
        const dir = process.cwd();
        const projectInfo = this.projectInfo;
        return new Promise((resolve,reject) => {
            glob('**',{
                cwd: dir,
                ignore: options.ignore || '',
                nodir: true
            },(err,files) => {
                if(err) reject(err);
                Promise.all(files.map(file => {
                    const filePath = path.join(dir,file)
                    return new Promise((resolve1,reject1) => {
                        ejs.renderFile(filePath,projectInfo,{},(err,result) => {
                            if(err){
                                reject1(err)
                            }else{
                                fse.writeFileSync(filePath,result)
                                resolve1(result)
                            }
                        })
                    })
                })).then(() => {
                    resolve()
                }).catch(err=>{
                    reject(err)
                })
            })
        })
    }
    async installNormalTemplate(){
        // 拷贝模版代码到当前目录
        let spinner = spinnerStart('正在安装模版...');
        await sleep()
        try{
            const templatePath = path.resolve(this.templageNpm.cacheFilePath,'template');
            const targetPath = process.cwd();
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(targetPath)
            fse.copySync(templatePath,targetPath)
        }catch(e){
            throw e;
        } finally{
            spinner.stop(true)
            log.success('模版安装成功')
        }
        const templateIgnore = this.templateInfo.ignore || [];
        const ignore = ['**/node_modules/**', ...templateIgnore]
        await this.ejsRender({ignore})
        // 依赖安装
        const { installCommand, startCommnad} = this.templateInfo;
        await this.execCommand(installCommand,'依赖安装过程中失败')
        // 启动命令执行
        await this.execCommand(installCommand,'启动执行命令失败')
    
    }
    async installCustomTamplate(){
        console.log('安装自定义模版')
    }

    async downloadTemplate(){
        // 1.通过项目模版api获取项目模版信息
        const { projectTemplate } = this.projectInfo;
        const templateInfo = this.template.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome,'.my-template-cli-dev','template')
        const storeDir = path.resolve(userHome,'.my-template-cli-dev','template', 'node_modules')
        console.log(targetPath,storeDir)
        const {npmName, version} = templateInfo;
        this.templateInfo = templateInfo;
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
              
            }catch(e){
                throw e
            } finally{
                spinner.stop(true)
                if(await templageNpm.exists()){
                    log.success('下载模版成功')
                    this.templageNpm = templageNpm;
                }
            }
    
           
        }else{

            const spinner = spinnerStart('正在更新模版...');
            await sleep()
            try{
                await templageNpm.update();
               
            }catch(e){
                throw e
            } finally{
                spinner.stop(true)
                if(await templageNpm.exists()){
                    log.success('更新模版成功')
                    this.templageNpm = templageNpm;
                }
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
        function isValidName(v){
            return /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])$/.test(v);
        }
        let projectInfo = {};
        let isProjectNameValid =false;
        if(isValidName(this.projectName)){
            isProjectNameValid = true;
            projectInfo.projectName = this.projectName;
        }
        
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
        this.template = this.template.filter(template => {
            return template.tag.includes(type)
        })
        const title = type === TYPE_PROJECT ? '项目' : '组件';
        const projectNamePrompt = {
            type: 'input',
                name: 'projectName',
                message: `请输入${title}名称`,
                default: '',
                validate: function (v) {
                    const done = this.async();
                    // 1.首字符必须为英文字符
                   // 2.尾字符必须为英文或数字，不能为字符
                   // 3.字符仅允许"-_"
                   setTimeout(function() {
                       if (!isValidName(v)) {
                           done(`请输入合法的${title}名称`);
                           return;
                       }
                       done(null, true);
                   }, 0);
                },
                filter: function (v) {
                    return v;
                }
        }

        const projectPrompt = [];
        if(!isProjectNameValid){
            projectPrompt.push(projectNamePrompt)
        }
        projectPrompt.push({
            type: 'input',
            name: 'projectVersion',
            message: `请输入${title}版本号`,
            default: '1.0.0',
            validate: function (v) {
                const done = this.async();
                setTimeout(function() {
                    if (!(!!semver.valid(v))) {
                        done(`请输入合法的${title}名称`);
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
            message: `请选择${title}模版`,
            choices: this.createTemplateChoices()
        })

        if(type === TYPE_PROJECT){
            // 2.获取项目的基本信息
            const project = await inquirer.prompt(projectPrompt)
            projectInfo = {
                ...projectInfo,
                type,
                ...project
            }
        }else if(type === 'component'){
            const descPrompt = {
                type: 'input',
                    name: 'componentDescription',
                    message: '请输入组件描述信息',
                    default: '',
                    validate: function (v) {
                        const done = this.async();
                       setTimeout(function() {
                           if (!v) {
                               done('请输入组件描述信息');
                               return;
                           }
                           done(null, true);
                       }, 0);
                    },
            }
            projectPrompt.push(descPrompt)
            // 获取组件基本信息
            const component = await inquirer.prompt(projectPrompt)
            projectInfo = {
                ...projectInfo,
                type,
                ...component
            }
        }

        if(projectInfo.projectName){
            projectInfo.name = projectInfo.projectName
            projectInfo.className = require('kebab-case')(projectInfo.projectName).replace(/^-/,'')
        }
        if(projectInfo.projectVersion){
            projectInfo.version = projectInfo.projectVersion;
        }
        if(projectInfo.componentDescription){
            projectInfo.description = projectInfo.componentDescription;
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