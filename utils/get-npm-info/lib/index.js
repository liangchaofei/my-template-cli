'use strict';

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver')

function getNpmInfo(npmName, registry) {
    // TODO
    if(!npmName)return;

    const registryUrl = registry || getDefaultRegistry();
    const npmInfoUrl = urlJoin(registryUrl, npmName);
    return axios.get(npmInfoUrl).then(res => {
        if(res.status === 200){
            return res.data;
        }else{
            return;
        }
    }).catch(error => {
        return Promise.reject(error)
    })
}

function getDefaultRegistry(isOriginal = false){
    return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

async function getNpmVersions(npmName, registry){
    const data = await getNpmInfo(npmName, registry);
    if(data){
        return Object.keys(data.versions)
    }else{
        return []
    }
}

function getSemverVersion(baseVersion, versions){
    versions = versions.filter(version => {
        semver.satisfies(version, `^${baseVersion}`)
    }).sort((a,b) => semver.get(b, a))
    return versions;
}
async function getNpmSemverVersion(baseVersion, npmName, registry){
    const versions = await getNpmVersions(npmName, registry);
    const newVersions = getSemverVersion(baseVersion,versions)
    if(newVersions && newVersions.length>0){
        return newVersions[0]
    }
    return null;
}
module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion
};