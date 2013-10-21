
var path = require('path')
  , rootPath = path.normalize(__dirname + '/..');

module.exports = function(app) {

  return {
    development: {
      db: 'mongodb://localhost/recharge-development',
      root: rootPath,
      app: {}
    },
    test: {
      db: 'mongodb://localhost/recharge-test',
      root: rootPath,
      app: {}
    },
    production: {
      db: 'mongodb://localhost/recharge-production',
      root: rootPath,
      app: {}
    }
  }

}
