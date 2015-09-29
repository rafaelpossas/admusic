var Tag = function(){
    var mongoose = require('mongoose');
    var fs = require('fs');
    var Q = require('q');
    var Artist = require("./Artist")

    var allArtists = [];
    var objectTaggedArtistArray = [];
    var taggedArtists = [];

    var iutil = require('../services/import');

    var TagSchema = mongoose.Schema({
        _id: Number,
        description: {type:String,required: '{PATH} is required'}
    });

    TagSchema.methods = {
        importTags: function(file){
            var deferred = Q.defer();
            var promise = Q.ninvoke(_model,"find",{});
            var isImported = false;
            var objectTagsArray = [];
            promise
                .then(function(col){
                    if(col.length === 0){
                        return iutil.readFileAsync(file,'utf8')
                    }else{
                        isImported = true;
                    }
                })
                .then(function(data){
                    if(data && !isImported){
                        var stringTagsArray = data.split('\r\n');
                        stringTagsArray.forEach(function(data){
                            var current = data.split('\t');
                            if(current[0]!=='tagID'){
                                var newTag = {
                                    _id: current[0],
                                    description: current[1]
                                }
                                if(newTag._id !=='' && typeof newTag.description !== 'undefined'){
                                    objectTagsArray.push(newTag);
                                }
                            }
                        });
                        var promises = objectTagsArray.map(function(data){
                            return Q.ninvoke(_model,"create",data);
                        });
                        return Q.all(promises);
                    }
                })
                .then(function(){
                    if(!isImported){
                        var data = [];
                        objectTagsArray.forEach(function(tag){
                            var stm = {
                                "statement":  'CREATE (t:Tag {tag})',
                                "parameters": {
                                    "tag": {
                                        "id": tag._id,
                                        "description": tag.description
                                    }
                                }
                            };
                            data.push(stm);
                        });
                        return iutil.statementRequest(data);
                    }
                })
                .then(function(res){
                    console.log("All tags were successfully saved");
                    deferred.resolve(res);
                })
                .catch(function(error){
                    console.log(error.stack);
                    deferred.reject(error);
                })
                .done();
            return deferred.promise;
        },
        importTagsRelationships: function (filename){


            var promise =  iutil.readFileAsync(filename,'utf8');
            var deferred = Q.defer();

            promise
                .then(function(data){
                    if(data){
                        var stringTaggedArtistsArray = data.split('\n');
                        stringTaggedArtistsArray.forEach(function(data){
                            var current = data.split('\t');
                            if(current[0]!=='userID'){
                                var newTag = {
                                    userid: current[0],
                                    artistid: current[1],
                                    tagid: current[2],
                                }
                                if(newTag.userid !==''){
                                    objectTaggedArtistArray.push(newTag);
                                }
                            }
                        })
                        return  Q.ninvoke(Artist.model,"find",{});
                    }
                })
                .then(function(col){
                    if(col){
                        allArtists = col;
                        if(allArtists){
                            allArtists.forEach(function(artist){
                                var tagsByArtist = iutil.getTagByArtist(artist._id,objectTaggedArtistArray);
                                artist.tags = tagsByArtist;
                                taggedArtists.push(artist);
                            })
                        }
                        var promises = taggedArtists.map(function(data){
                            return data.save();
                        });
                        return Q.all(promises);
                    }
                })

                .then(function(){
                    var data = [];
                    taggedArtists.forEach(function(artist){
                        artist.tags.forEach(function(tag){
                            if(tag && artist){
                                var stm = {
                                    "statement": 'MATCH (t:Tag),(a:Artist) ' +
                                    'WHERE t.id="'+tag.tagid+'" AND a.id="'+artist._id+'" '+
                                    'CREATE (a)-[:TAGGED_WITH {userid: '+ tag.userid+' }]->(t)'
                                };
                                data.push(stm);
                            }

                        })
                    })
                    return iutil.statementRequest(data);
                })
                .then(function(res){
                    console.log("All tags were saved");
                    deferred.resolve(res);
                })
                .catch(function(error){
                    console.log(error.stack);
                    deferred.reject(error);
                }).done();

            return deferred.promise;
        },

    };
    var _model = mongoose.model('Tag',TagSchema);

    return{
        model: _model,
        schema: TagSchema
    }

}();


module.exports = Tag;
