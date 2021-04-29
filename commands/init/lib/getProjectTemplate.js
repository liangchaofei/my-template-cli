const request = require('@my-template-cli/request')

module.exports = function () {
  return request({
    url: '/project/template'
  })
}