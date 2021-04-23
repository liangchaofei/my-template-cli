'use strict';

const Command = require('@my-template-cli/command');
const log = require('@my-template-cli/log')
class InitCommand extends Command{
    init(){
        this.projectName = this._argv[0] || '';
        this.force == !!this.cmd.force;
        log.verbose('projectName', this.projectName)
        log.verbose('force', this.force)
    }
    exec(){
        console.log('exec')
    }
}

function init(argv) {
    // TODO
    return new InitCommand(argv)
}
module.exports = init;
module.exports.InitCommand = InitCommand;