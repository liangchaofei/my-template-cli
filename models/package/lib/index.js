'use strict';
const pkgDir = require('pkg-dir').sync;
const pathExists = require('path-exists').sync;
const path = require('path')
const npminstall = require('npminstall')
const { isObject } = require('@my-template-cli/utils')
const formatPath = require('@my-template-cli/format-path')
const { getDefaultRegistry, getNpmLatestVersion} = require('@my-template-cli/get-npm-info')
class Package{
    constructor(options){
        if(!options){
            throw new Error('Package类的options参数不能为空！')
        }
        if(!isObject(options)){
            throw new Error('Package类的options参数必须为对象！')
        }
        // package路径
        this.targetPath = options.targetPath;
        // 缓存package的路径
        this.storeDir = options.storeDir;
        // package的name
        this.packageName = options.packageName;
        // package的version
        this.packageVersion = options.packageVersion;
        // package的缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/','_');
    }

    async prepare(){
        if(this.packageVersion === 'latest'){
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }

    get cacheFilePath(){
        return path.resolve(this.storeDir,`_${this.cacheFilePathPrefix}@${this.packageVersion}@${tihs.packageName}`)
    }

    // 判断当前package是否存在
    async exists(){
        if(this.storeDir){
           await this.prepare()
           return pathExists(this.cacheFilePath)
        }else{
            return pathExists(this.targetPath)
        }
    }

    // 安装package
    async install(){
        await this.prepare()
       return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs:[
                {
                    name: this.packageName,
                    versoion: this.packageVersion
                }
            ]
        })
    }

    //更新package
    update(){}

    // 获取入口文件的路径
    getRootFilePath(){
        // 1.获取package.json所在目录，使用pkg-dir包
        const dir = pkgDir(this.targetPath)
        if(dir){
            // 2.读取package.json , 使用require
            const pkgFile = require(path.resolve(dir,'package.json'))
            // 3.main/lib, 输出path
            if(pkgFile && pkgFile.main){
                // 4.路径的兼容(mac/windows)
                return formatPath(path.resolve(dir, pkgFile.main)) // 获取入口文件的绝对路径
            }
            
        }
        return null;
    }
}


module.exports = Package;

