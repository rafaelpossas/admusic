var Tag = function(){
    var mongoose = require('mongoose');
    var fs = require('fs');
    var Q = require('q');
    var Artist = require("./Artist")
    var TagSchema = mongoose.Schema({
        _id: Number,
        description: {type:String,required: '{PATH} is required'}
    });

    TagSchema.methods = {
        importTags: function (){
            var readFileAsync = function(name,type){
                return Q.nfcall(fs.readFile,name,type);
            }
            var promise = _model.find({}).exec();
            var objectTaggedArtistArray = [];
            var allTags = [];
            var allArtists = [];
            var isImported = false;
            promise
                .then(function(col){
                  if(col.length === 0){
                      return readFileAsync('./data/tags.dat','utf8')
                  }else{
                      isImported = true;
                  }
                })
                .then(function(data){
                    if(data !== undefined){
                        var stringTagsArray = data.split('\r\n');
                        var objectTagsArray = []
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
                        return readFileAsync('./data/user_taggedartists-timestamps.dat','utf8');
                    }
                })
                .then(function(data){
                    if(data !== undefined){
                        var stringTaggedArtistsArray = data.split('\r\n');
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
                        return Artist.model.find({}).exec();
                    }
                })
                .then(function(col){
                    if(col!== undefined){
                        allArtists = col;
                        var taggetArtists = []
                        var getTagByArtist = function(id){
                            var tagsByArtist = [];
                            objectTaggedArtistArray.forEach(function(data){
                                if(data.artistid == id){
                                    tagsByArtist.push(data.tagid);
                                }
                            })
                            return tagsByArtist;
                        }
                        if(allArtists !== undefined && allTags!== undefined){
                            allArtists.forEach(function(artist){
                                var tagsByArtist = getTagByArtist(artist._id);
                                artist.tags = tagsByArtist;
                                taggetArtists.push(artist);
                                console.log(artist);
                            })
                        }
                        var promises = taggetArtists.map(function(data){
                            return data.save();
                        });
                        return Q.all(promises);
                    }

                })
                .then(function(){
                    console.log("All Artists are saved");
                });
        },

    };
    var _model = mongoose.model('Tag',TagSchema);

    return{
        model: _model,
        schema: TagSchema
    }

}();


module.exports = Tag;
