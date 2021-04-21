'use strict';
const pkgDir = require('pkg-dir').sync;
const path = require('path')
const npminstall = require('npminstall')
const { isObject } = require('@my-template-cli/utils')
const formatPath = require('@my-template-cli/format-path')
const { getDefaultRegistry} = require('@my-template-cli/get-npm-info')
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
    }

    // 判断当前package是否存在
    exists(){}

    // 安装package
    install(){
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
        console.log(dir)
        if(dir){
            // 2.读取package.json , 使用require
            const pkgFile = require(path.resolve(dir,'package.json'))
            console.log('pkgFile',pkgFile)
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

