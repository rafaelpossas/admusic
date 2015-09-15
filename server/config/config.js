/**
 * Created by rafaelpossas on 3/25/15.
 */
var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');

module.exports = {

  development: {
    name: 'dev',
    db: 'mongodb://localhost/admusic',
    rootPath: rootPath,
    port: process.env.PORT || 3000,

  },
  production:{
    name: 'prod',
    db: 'mongodb://procymo:cymo@2014@ds031852.mongolab.com:31852/procymo-admin',
    rootPath: rootPath,
    port: process.env.PORT || 80,
  },
  test:{
    name: 'test',
    db: 'mongodb://localhost/admusic-test',
    rootPath: rootPath,
    port: process.env.PORT || 3000,
  }
}