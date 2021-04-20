'use strict';
const path = require('path')


function formatPath(p) {
    // TODO
    if(p && typeof p ==='string'){
        // 兼容mac windows
        const sep = path.sep;
        if(sep === '/'){
            return p;
        }else{
            return p.replace(/\\/g,'/')
        }
    }
    return p;
}
module.exports = formatPath;