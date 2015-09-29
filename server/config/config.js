/**
 * Created by rafaelpossas on 3/25/15.
 */
var path = require('path');
var rootPath = path.normalize(__dirname + '/../../');
var enc = require('../utilities/encryption');
module.exports = {

  development: {
    name: 'dev',
    db: 'mongodb://localhost/admusic-test',
    neo4j: 'http://neo4j:1234@localhost:7474',
    neo4jtoken: 'Basic '+enc.base64Encoding("neo4j:1234"),
    rootPath: rootPath,
    port: process.env.PORT || 3000,

  },
  production:{
    name: 'prod',
    db: 'mongodb://procymo:cymo@2014@ds031852.mongolab.com:31852/procymo-admin',
    neo4j: 'http://neo4j:1234@localhost:7474',
    neo4jtoken: 'Basic '+enc.base64Encoding("neo4j:1234"),
    rootPath: rootPath,
    port: process.env.PORT || 80,
  },
  test:{
    name: 'test',
    db: 'mongodb://localhost/admusic-test',
    neo4j: 'http://neo4j:1234@localhost:7474',
    neo4jtoken: 'Basic '+enc.base64Encoding("neo4j:1234"),
    rootPath: rootPath,
    port: process.env.PORT || 3000,
  }
}