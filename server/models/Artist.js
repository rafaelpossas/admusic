/**
 * Created by rafaelpossas on 11/09/15.
 */
/**
 * Created by rafaelpossas on 2/09/15.
 */
/**
 * Created by rafaelpossas on 3/27/15.
 */


var Artist = function(){
    var mongoose = require('mongoose');
    var fs = require('fs');
    var User = require('./User');
    var Q = require('q');
    var ArtistSchema = mongoose.Schema({
        _id: Number,
        name: {type:String,required: '{PATH} is required'},
        url: String,
        img: String,
        tags: [String]
    });

    ArtistSchema.methods = {
        importArtists: function (){
            var promise = _model.find({}).exec();
            promise.then(function(col){
                if(col.length === 0){
                    fs.readFile('./data/artists.dat', 'utf8', function (err,data) {
                        if (err) {
                            return console.log(err);
                        }
                        var artistsCol = data.split('\n');
                        artistsCol.forEach(function(line){
                            var artist = line.split('\t');
                            if(artist.length == 4 && artist[0]!=='id'){
                                var newArtist = {
                                    _id: artist[0],
                                    name: artist[1],
                                    url: artist[2],
                                    img: artist[3]

                                }
                                _model.create(newArtist,function(err){
                                    if(err) next(err);
                                });
                            }
                        });
                    });
                }
            },function(err){
                next(err);
            })
        },
        recomendTopFiveArtistsByFriendsListeningCount: function(id){4
            return User.model.aggregate({$match:{friends:id}},{$unwind:"$artists"},{$group:{_id:"$artists._id",count:{$sum:"$artists.count"}}},{$sort:{count:-1}}).exec();
        },
        recomendTopFiveArtistsByFriendsCount: function(id){4
            return User.model.aggregate({$match:{friends:id}},{$unwind:"$artists"},{$group:{_id:"$artists._id",count:{$sum:1}}},{$sort:{count:-1}}).exec();
        },
        rankTopFiveArtistsByListeningCount:function(){
            return User.model.aggregate({$unwind:"$artists"},{$group:{_id:"$artists._id",count:{$sum:"$artists.count"}}},{$sort:{count:-1}},{$limit:5}).exec();
        },
        rankTopFiveArtistsByUserCount:function(){
            return User.model.aggregate({$unwind:"$artists"},{$group:{_id:"$artists._id",count:{$sum:1}}},{$sort:{count:-1}},{$limit:5}).exec();
        },

    };
    var _model = mongoose.model('Artist',ArtistSchema);

    return{
        model: _model,
        schema: ArtistSchema
    }

}();


module.exports = Artist;
