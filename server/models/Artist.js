/**
 * Created by rafaelpossas on 11/09/15.
 */
/**
 * Created by rafaelpossas on 2/09/15.
 */
var Artist = function () {
    var mongoose = require('mongoose');
    var User = require('./User');
    var Q = require('q');
    var request = require('superagent');
    var iutil = require('../services/import');
    var TagSchema = mongoose.Schema({
        userid: Number,
        tagid: Number
    });
    var ArtistSchema = mongoose.Schema({
        _id: Number,
        name: {type: String, required: '{PATH} is required'},
        url: String,
        img: String,
        tags: [TagSchema]
    });

    ArtistSchema.methods = {
        importArtists: function () {
            var deferred = Q.defer();
            var allArtists = [];
            var promise = Q.ninvoke(_model, "find", {});
            var isImported = false;
            promise
                .then(function (col) {
                    if (col.length === 0) {
                        return iutil.readFileAsync('./data/artists.dat', 'utf8')
                    } else {
                        isImported = true;
                    }
                })
                .then(function (data) {
                    if (data && !isImported) {
                        var artistsCol = data.split('\n');
                        artistsCol.forEach(function (line) {
                            var artist = line.split('\t');
                            if (artist.length == 4 && artist[0] !== 'id') {
                                var newArtist = {
                                    _id: artist[0],
                                    name: artist[1],
                                    url: artist[2],
                                    img: artist[3]

                                }
                                allArtists.push(newArtist);
                            }
                        });
                        var promises = allArtists.map(function (data) {
                            return Q.ninvoke(_model, "create", data);
                        });
                        return Q.all(promises)
                    }
                })
                .then(function (res) {
                    if (res && !isImported) {
                        var i = 0;
                        var data = []
                        while (i < allArtists.length) {
                            var stm = {
                                "statement": 'CREATE (a:Artist {props})',
                                "parameters": {
                                    "props": {
                                        "name": allArtists[i].name,
                                        "id": allArtists[i]._id,
                                        "url": allArtists[i].url,
                                        "img": allArtists[i].img
                                    }
                                }
                            };
                            data.push(stm);
                            i++;
                        }

                        return iutil.statementRequest(data);
                    }

                }).then(function (res) {
                    console.log("All artists were saved")
                    deferred.resolve(res);
                })
                .catch(function (error) {
                    console.log(error.stack);
                    deferred.reject(error);
                }).done();

            return deferred.promise;
        },
        listen: function (user, artist) {
            var promise = new Promise(resolver.bind(this));

            function resolver(resolve, reject) {
                var hasArtist = false;
                if (user.artists.length > 0) {
                    user.artists.forEach(function (dt) {
                        if (artist._id == dt._id) {
                            dt.count += 1;
                            hasArtist = true;
                        }
                    })
                } else if (!hasArtist || user.artists.length == 0) {
                    user.artists.push({_id: artist._id, count: 1});
                }
                user.save(function (err, result) {
                    if (err) reject(err);
                    resolve(result);
                });
            }

            return promise;
        },
        tag: function (user, artist, tag) {
            var promise = new Promise(resolver.bind(this));

            function resolver(resolve, reject) {
                var hasTag = false;
                if (artist.tags.length > 0) {
                    artist.tags.forEach(function (dt) {
                        if (tag._id == dt.tagid) {
                            hasTag = true;
                            resolve(artist);
                        }
                    })
                }
                if (artist.tags.length == 0 || !hasTag) {
                    artist.tags.push({tagid: tag._id, userid: user._id});
                    artist.save(function (err, result) {
                        if (err) reject(err);
                        resolve(result);
                    });
                }

            }

            return promise;
        },
        getArtistMDB: function (id) {
            return _model.findOne({_id: id}).exec();
        },
        getArtistN4J: function (id) {
            var stm = {
                "statement": 'MATCH (a:Artist) WHERE a.id="' + id + '" RETURN a'
            };
            var data = [];
            data.push(stm);

            return iutil.statementRequest(data);
        },
        recomendTopFiveArtistsByFriendsListeningCountMongoDB: function (id) {
            return User.model.aggregate(
                {$match: {friends: id.toString()}},
                {$unwind: "$artists"},
                {$group: {_id: "$artists._id", count: {$sum: "$artists.count"}}},
                {$sort: {count: -1}},
                {$limit: 5}).exec();
        },
        recomendTopFiveArtistsByFriendsListeningCountNeo4j: function (id) {
            var deferred = Q.defer();
            var query = {
                "query": "MATCH (u:User)-->(f:User)-[l:LIKE]->(a:Artist) WHERE u.id={id} " +
                "RETURN a.id as id,sum(l.count) as count ORDER BY count DESC limit 5",
                "params": {
                    id: id.toString()
                }
            }
            iutil.cypherRequest(query)
                .then(function (data) {
                    deferred.resolve(data.body.data);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        findAllArtistsByGroup: function (artistArrayString) {
            var deferred = Q.defer();
            var query = {
                "query": "MATCH (a:Artist) WHERE a.id IN [" + artistArrayString + "] RETURN a.id,a.img,a.name,a.url"
            }
            iutil.cypherRequest(query)
                .then(function (res) {
                    var result = [];
                    res.body.data.forEach(function (artist) {
                        var formattedArtist = {
                            id: artist[0],
                            img: artist[1],
                            name: artist[2],
                            url: artist[3]
                        }
                        result.push(formattedArtist);
                    });
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        getArtistsStringByArray: function (array) {
            var resultString = "";
            array.forEach(function (str) {
                resultString += ",'" + str + "'";
            });
            return resultString.substr(1, resultString.length - 1);
        },
        recomendTopFiveArtistsByFriendsListeningCountPolyglot: function (id) {
            var deferred = Q.defer();
            var friends = [];
            var currentCount;
            User.schema.methods.findAllUserFriends(id)
                .then(function (data) {
                    data.forEach(function (friend) {
                        friends.push(Number(friend.id));
                    });
                    return User.model.aggregate(
                        {$match: {_id: {$in: friends}}},
                        {$unwind: "$artists"},
                        {$group: {_id: "$artists._id", count: {$sum: "$artists.count"}}},
                        {$sort: {count: -1}},
                        {$limit: 5}).exec();
                })
                .then(function (res) {
                    var artistStringArray;
                    var artists = [];
                    currentCount = res;
                    currentCount.forEach(function (artist) {
                        artists.push(Number(artist._id));
                    });
                    artistStringArray = ArtistSchema.methods.getArtistsStringByArray(artists);
                    return ArtistSchema.methods.findAllArtistsByGroup(artistStringArray);
                }).then(function (res) {
                    currentCount.forEach(function (count) {
                        res.forEach(function (artist) {
                            count.name = artist.name;
                            count.img = artist.img
                            count.url = artist.url;
                        });
                    });
                    deferred.resolve(currentCount);
                }, function (err) {
                    console.log(err);
                    deferred.reject(err);
                });
            return deferred.promise;

        },
        recomendTopFiveArtistsByFriendsCountMongoDB: function (id) {
            return User.model.aggregate(
                {$match: {friends: id.toString()}},
                {$unwind: "$artists"},
                {$group: {_id: "$artists._id", count: {$sum: 1}}},
                {$sort: {count: -1}},
                {$limit: 5}).exec();
        },
        recomendTopFiveArtistsByFriendsCountNeo4j: function (id) {
            var deferred = Q.defer();
            var query = {
                "query": "MATCH (u:User)-->(f:User)-[l:LIKE]->(a:Artist) WHERE u.id={id} " +
                "RETURN a.id as id,count(l) as count ORDER BY count DESC limit 5",
                "params": {
                    id: id.toString()
                }
            }
            iutil.cypherRequest(query)
                .then(function (data) {
                    deferred.resolve(data.body.data);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        recomendTopFiveArtistsByFriendsCountPolyglot: function (id) {
            var deferred = Q.defer();
            var friends = [];
            var currentCount;
            User.schema.methods.findAllUserFriends(id)
                .then(function (data) {
                    data.forEach(function (friend) {
                        friends.push(Number(friend.id));
                    });
                    return User.model.aggregate(
                        {$match: {_id: {$in: friends}}},
                        {$unwind: "$artists"},
                        {$group: {_id: "$artists._id", count: {$sum: 1}}},
                        {$sort: {count: -1}},
                        {$limit: 5}).exec();
                })
                .then(function (res) {
                    return ArtistSchema.methods.formatArtistsCountByIds(res);
                },function (err) {
                    console.log(err);
                    deferred.reject(err);
                });
            return deferred.promise;

        },
        formatArtistsCountByIds: function(data){
            var deferred = Q.defer();
            var artistStringArray;
            var artists = [];
            var currentCount = data;
            currentCount.forEach(function (artist) {
                artists.push(Number(artist._id));
            });
            artistStringArray = ArtistSchema.methods.getArtistsStringByArray(artists);
            ArtistSchema.methods.findAllArtistsByGroup(artistStringArray)
                .then(function (res) {
                    currentCount.forEach(function (count) {
                        res.forEach(function (artist) {
                            if(count._id == artist.id){
                                count.name = artist.name;
                                count.img = artist.img;
                                count.url = artist.url;
                            }

                        });
                    });
                    deferred.resolve(currentCount);
                },function(error){
                    deferred.reject(error);
                });
            return deferred.promise
        },
        rankTopFiveArtistsByListeningCountMongoDB: function () {
            var deferred = Q.defer();
            var promise = User.model.aggregate(
                {$unwind: "$artists"},
                {$group: {_id: "$artists._id", count: {$sum: "$artists.count"}}},
                {$sort: {count: -1}},
                {$limit: 5}).exec();
            promise
                .then(function(data){
                    return ArtistSchema.methods.formatArtistsCountByIds(data);
                })
                .then(function(data){
                    deferred.resolve(data);
                },function(err){
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        rankTopFiveArtistsByUserCountMongoDB: function () {
            var deferred = Q.defer();
            var promise =  User.model.aggregate(
                {$unwind: "$artists"},
                {$group: {_id: "$artists._id", count: {$sum: 1}}},
                {$sort: {count: -1}},
                {$limit: 5}).exec();
            promise
                .then(function(data){
                    return ArtistSchema.methods.formatArtistsCountByIds(data);
                })
                .then(function(data){
                    deferred.resolve(data);
                },function(err){
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        recommendByTag: function(id,deferred){
            if(!deferred) deferred = Q.defer();
            var randomTag;
            var query = {
                "query": "MATCH (a:Artist)-[tw:TAGGED_WITH]->(t:Tag) WHERE rand() < 0.4 " +
                         "AND tw.userid={id} RETURN t.id,t.description LIMIT 1",
                "params": {id: Number(id)}
            }
            iutil.cypherRequest(query)
                .then(function (res) {
                    if(res.body.data.length > 0){
                        randomTag = res.body.data[0];
                        return User.model.findOne({_id:id}).exec();
                    }
                    else ArtistSchema.methods.recommendByTag(id,deferred);

                }).then(function(res){
                    if(res){
                        var artistsId = [];
                        res.artists.forEach(function(art){artistsId.push(Number(art._id));});
                        var artistsArray = ArtistSchema.methods.getArtistsStringByArray(artistsId)
                        var query = {
                            "query": "MATCH (a:Artist)-[tw:TAGGED_WITH]->(t:Tag) WHERE (NOT a.id IN ["+artistsArray+"]) " +
                                     "AND t.id={id} RETURN DISTINCT a.id,a.img,a.name,a.url LIMIT 5",
                            "params":{id: randomTag[0]}
                        }
                        return  iutil.cypherRequest(query)
                    }
                }).then(function(res){
                    if(res){
                        var artistsId = [];
                        res.body.data.forEach(function(artist){artistsId.push(Number(artist[0]))});
                        return User.model.aggregate(
                            {$unwind: "$artists"},
                            {$match: {"artists._id":{$in: artistsId}}},
                            {$group: {_id: "$artists._id", count: {$sum: 1}}},
                            {$sort: {count: -1}},
                            {$limit: 5}).exec();
                    }
                }).then(function(res){
                    if(res){return ArtistSchema.methods.formatArtistsCountByIds(res);}
                }).then(function(res){
                    if(res){deferred.resolve(res);}
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        }

    };
    var _model = mongoose.model('Artist', ArtistSchema);

    return {
        model: _model,
        schema: ArtistSchema
    }

}();


module.exports = Artist;
