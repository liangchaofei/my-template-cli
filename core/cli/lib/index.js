'use strict';

module.exports = core;

const pkg = require('../package.json')
const log = require('@my-template-cli/log')
function core() {
    // TODO
    checkPkgVersion()
}

// 检查版本号
function checkPkgVersion(){
    log.notice('cli',pkg.version)
}