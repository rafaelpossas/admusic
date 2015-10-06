/**
 * Created by rafaelpossas on 3/25/15.
 */
var mng = function(address,importData){
    var mongoose = require('mongoose');
    var Artist = require('../models/Artist');
    var Tag = require('../models/Tag');
    var User = require('../models/User')
    var iutil = require('../services/import');
    var neo4j = require('../services/neo4j');
    var Q = require('q');

    var deferred = Q.defer();
    mongoose.connect(address);
      var connection = mongoose.connection;
      connection.on('error',console.error.bind(console,'connection error....'));
      connection.once('open',function callback() {
          console.log('Connected to: '+address)
      });
    if(importData === true){
        var user_file1;
        var user_file2;
        var tags_file1;
        var tags_file2;
        var tags_file3;

        if(global.config.name === 'dev' || global.config.name === 'prod'){
            user_file1 = './data/user_artists.dat';
            user_file2 = './data/user_friends.dat';
            tags_file1 = './data/tags.dat';
            tags_file2 = './data/user_taggedartists.dat';
            tags_file3 = './data/user_taggedartists_2.dat'
        }else if(global.config.name === 'test'){
            user_file1 = './data/test/user_artists.dat';
            user_file2 = './data/test/user_friends.dat';
            tags_file1 = './data/test/tags.dat';
            tags_file2 = './data/test/user_taggedartists.dat';
        }



        Artist.model.collection.remove();
        Tag.model.collection.remove();
        User.model.collection.remove();

        var promise = neo4j.cleanNeo4j();

        promise
            .then(function(){
                return iutil.importArtists();
            })
            .then(function(){
                console.log("Importing Users.");
                return iutil.importUsers(user_file1,user_file2);
            })
            .then(function(){
                console.log("Importing Tags.");
                return iutil.importTags(tags_file1);
            })
            .then(function(){
                console.log("Importing Tags relationships #1.");
                return iutil.importTagsRelationships(tags_file2);
            })
            .then(function(){
                console.log("Importing Tags relationships #2.");
                return iutil.importTagsRelationships(tags_file3);
            })
            .then(function(){
                console.log("Tag relationships were successfully saved")
                deferred.resolve();
            })
            .catch(function(error){
                console.log(error.stack?error.stack:error);
                deferred.reject(error);
            }).done();

    }
    return deferred.promise


};
module.exports = mng;

