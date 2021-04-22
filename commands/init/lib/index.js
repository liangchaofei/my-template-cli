'use strict';

const Command = require('@my-template-cli/command');

class InitCommand extends Command{

}

function init(argv) {
    // TODO
    return new InitCommand(argv)
}
module.exports = init;
module.exports.InitCommand = InitCommand;