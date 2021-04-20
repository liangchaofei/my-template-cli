'use strict';
const Package = require('@my-template-cli/package')
const log = require('@my-template-cli/log')

const SETTINGS = {
    init: '@@my-template-cli/init'
}

function exec() {
    const targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj.name(); // 获取 init这个名称
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest'
    const pkg = new Package({
        targetPath,
        packageName,
        packageVersion
    });
    console.log(pkg)
}

module.exports = exec;
