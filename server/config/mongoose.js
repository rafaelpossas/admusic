/**
 * Created by rafaelpossas on 3/25/15.
 */
var mng = function(address){
    var mongoose = require('mongoose');
    var Artist = require('../models/Artist');
    var Tag = require('../models/Tag');
    var User = require('../models/User')

    mongoose.connect(address);
      var db = mongoose.connection;
      db.on('error',console.error.bind(console,'connection error....'));
      db.once('open',function callback() {
          console.log('Connected to: '+address)
      });
    Artist.schema.methods.importArtists();
    Tag.schema.methods.importTags();
    User.schema.methods.importUserData();

};
module.exports = mng;

