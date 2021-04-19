'use strict';
const Package = require('@my-template-cli/package')


function exec() {
    // TODO
    const pkg = new Package();
    console.log(pkg)
    console.log('exec')
    console.log('exec_target_path',process.env.CLI_TARGET_PATH)
    console.log(process.env.CLI_HOME_PATH)
}

module.exports = exec;
