/**
 * Created by rafaelpossas on 11/09/15.
 */
/**
 * Created by rafaelpossas on 2/09/15.
 */
var Artist = function () {
    var mongoose = require('mongoose');
    var User = require('./User');
    var Tag = require('./Tag');
    var neo4j = require('../services/neo4j')
    var Q = require('q');

    var TagSchema = mongoose.Schema({
        userid: Number,
        _id: Number
    });
    var ArtistSchema = mongoose.Schema({
        _id: Number,
        name: {type: String, required: '{PATH} is required'},
        url: String,
        img: String,
        tags: [TagSchema]
    });

    ArtistSchema.methods = {
        listen: function (user, artist) {
            var promise = new Promise(resolver.bind(this));
            var currentCount;

            function resolver(resolve, reject) {
                var hasArtist = false;
                if (user.artists.length > 0) {
                    user.artists.forEach(function (dt) {
                        if (artist._id == dt._id) {
                            dt.count += 1;
                            hasArtist = true;
                            currentCount = dt.count;
                        }
                    })
                }
                if (!hasArtist) {
                    user.artists.push({_id: artist._id, count: 1});
                    currentCount = 1;
                }
                user.save(function (err) {
                    if (err) reject(err);
                    resolve({
                        _id: artist._id,
                        name: artist.name,
                        url: artist.url,
                        img: artist.img,
                        count: currentCount
                    });
                });
            }

            return promise;
        },
        addTag: function (user, artist, tag) {
            var promise = new Promise(resolver.bind(this));

            function resolver(resolve, reject) {
                var hasTag = false;
                if (artist.tags.length > 0) {
                    artist.tags.forEach(function (dt) {
                        if (tag._id == dt._id) {
                            hasTag = true;
                            reject({message: "You can' add a duplicate tag to the same Artist"})
                        }
                    })
                }
                if (artist.tags.length == 0 || !hasTag) {
                    artist.tags.push({_id: tag._id, userid: user._id});
                    artist.save(function (err, result) {
                        if (err) reject(err);
                        var query = {
                            "query": "MATCH (t:Tag),(a:Artist) WHERE a.id={aid} AND t.id={tid}" +
                            "CREATE (a)-[r:TAGGED_WITH]->(t) RETURN a,r,t",
                            "params": {
                                aid: artist._id.toString(),
                                tid: tag._id.toString()
                            }
                        };

                        neo4j.cypherRequest(query)
                            .then(function () {
                                return ArtistSchema.methods.getArtistInformationMongoDB(artist._id)
                            }).then(function (res) {
                                resolve(res);
                            }, function (err) {
                                reject(err);
                            });
                    });
                }

            }

            return promise;
        },
        getArtistInformationNeo4j: function (id) {
            var defer = Q.defer();
            var query = {
                "query": 'MATCH (a:Artist)-[:TAGGED_WITH]->(t:Tag) WHERE a.id={id} ' +
                'OPTIONAL MATCH N RETURN a,t',
                "params": {
                    id: id.toString()
                }
            };
            neo4j.cypherRequest(query)
                .then(function (res) {
                    var artist;
                    res.body.data.forEach(function (artistTag) {
                        if (!artist) {
                            artist = artistTag[0].data;
                            artist.tags = [];
                        }
                        artist.tags.push(artistTag[1].data);
                    });
                    defer.resolve(artist);

                }).catch(function (err) {
                    defer.reject(err);
                }).done();
            return defer.promise;
        },
        getArtistInformationMongoDB: function (id) {
            var defer = Q.defer();
            var artist;
            _model.findOne({_id: id}).exec()
                .then(function (data) {
                    var tagGroup = [];
                    artist = data;
                    artist.tags.forEach(function (tag) {
                        tagGroup.push(tag._id);
                    })
                    return Tag.model.find({_id: {$in: tagGroup}}).exec()
                })
                .then(function (res) {
                    artist.tags = res;
                    defer.resolve({
                        _id: artist._id,
                        name: artist.name,
                        url: artist.url,
                        img: artist.img,
                        tags: res
                    });
                }, function (err) {
                    defer.reject(err);
                });
            return defer.promise;
        },
        getAllArtists: function (id) {
            var query = {
                "query": 'MATCH (a:Artist) RETURN a.id,a.name,a.img,a.url'
            }
            return neo4j.cypherRequest(query);
        },
        findAllArtistsByGroup: function (artistArrayString) {
            var deferred = Q.defer();
            var query = {
                "query": "MATCH (a:Artist) WHERE a.id IN [" + artistArrayString + "] RETURN a.id,a.img,a.name,a.url"
            }
            neo4j.cypherRequest(query)
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
        recommendTopFiveArtistsByFriendsListeningCountMongoDB: function (id) {
            var deferred = Q.defer();
            User.model.find({_id:id}, {"artists._id":1}).exec()
                .then(function(data){
                    var artistsId = [];
                    data[0].artists.forEach(function(data){
                       artistsId.push(data._id);
                    });
                    return User.model.aggregate(
                        {$match: {friends: id.toString()}},
                        {$unwind: "$artists"},
                        {$match: {"artists._id":{$nin:artistsId}}},
                        {$group: {_id: "$artists._id", count: {$sum: "$artists.count"}}},
                        {$sort: {count: -1}},
                        {$limit: 5}).exec();
                })
                .then(function(result){
                    deferred.resolve(result);
                },function(err){
                    deferred.reject(err);
                });
            return deferred.promise;

        },
        recommendTopFiveArtistsByFriendsListeningCountNeo4j: function (id) {
            var deferred = Q.defer();
            var query = {
                "query": "MATCH (u:User)-->(f:User)-[l:LISTEN]->(a:Artist) WHERE u.id={id} AND not(u-[:LISTEN]->(a))"+
                "RETURN a.id as _id,a.name as name,a.img as img,a.url as url,sum(l.count) as count ORDER BY count DESC limit 5",
                "params": {
                    id: id.toString()
                }
            }
            neo4j.cypherRequest(query)
                .then(function (res) {
                    var results = [];
                    res.body.data.forEach(function(count){
                        results.push({
                            _id: count[0],
                            name: count[1],
                            img: count[2],
                            url: count[3],
                            count: count[4]
                        })
                    });
                    deferred.resolve(results);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        recommendTopFiveArtistsByFriendsCountMongoDB: function (id) {
            var deferred = Q.defer();
            User.model.find({_id:id}, {"artists._id":1}).exec()
                .then(function(data){
                    var artistsId = [];
                    data[0].artists.forEach(function(data){
                        artistsId.push(data._id);
                    });
                    return User.model.aggregate(
                        {$match: {friends: id.toString()}},
                        {$unwind: "$artists"},
                        {$match: {"artists._id":{$nin:artistsId}}},
                        {$group: {_id: "$artists._id", count: {$sum: 1}}},
                        {$sort: {count: -1}},
                        {$limit: 5}).exec();
                })
                .then(function(result){
                    deferred.resolve(result);
                },function(err){
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        recommendTopFiveArtistsByFriendsCountNeo4j: function (id) {
            var deferred = Q.defer();
            var query = {
                "query": "MATCH (u:User)-->(f:User)-[l:LISTEN]->(a:Artist) WHERE u.id={id} AND not(u-[:LISTEN]->(a))"+
                "RETURN a.id as _id,a.name as name,a.img as img,a.url as url,count(l) as count ORDER BY count DESC limit 5",
                "params": {
                    id: id.toString()
                }
            }
            neo4j.cypherRequest(query)
                .then(function (res) {
                    var results = [];
                    res.body.data.forEach(function(count){
                        results.push({
                            _id: count[0],
                            name: count[1],
                            img: count[2],
                            url: count[3],
                            count: count[4]
                        })
                    });
                    deferred.resolve(results);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        recommendByTagMongoDB: function(id){
            var deferred = Q.defer();
            var artistsIds=[];
            var countResults = [];
            var promise = Artist.model.aggregate(
                {$unwind: "$tags"},
                {$match: {"tags.userid": id}},
                {$group: {_id: "$tags._id"}}).exec();
            promise
                .then(function(tags){
                    var n = tags.length;
                    var r = Math.floor(Math.random() * n);
                    var randomTag = tags[r];
                    return Artist.model.find({"tags._id": randomTag._id}).exec();
                })
                .then(function(artists){

                    artists.forEach(function(artist){
                        artistsIds.push(artist._id);
                    })
                    return User.model.find({_id:id},{"artists._id":1,_id:0}).exec()
                })
                .then(function(res){
                    var userArtistsIds = [];
                    res[0].artists.forEach(function(artist){
                        userArtistsIds.push(artist._id);
                    });
                    return User.model.aggregate(
                        {$match:{"artists._id":{$in:artistsIds}}},
                        {$unwind:"$artists"},
                        {$match:{"artists._id":{$nin:userArtistsIds}}},
                        {$group:{_id:"$artists._id",count:{$sum:1}}},
                        {$sort:{count:-1}},
                        {$limit:5}).exec();
                })
                .then(function(res){
                    res.forEach(function(count){
                        countResults.push({
                            _id: count._id,
                            count: count.count
                        });
                    });
                    var artists = [];
                    countResults.forEach(function(count){
                        artists.push(count._id);
                    });
                    return Artist.model.find({_id:{$in: countResults}}).exec();
                }).then(function(res){
                    countResults.forEach(function(count){
                        res.forEach(function(artist){
                            if(count._id == artist._id){
                                count.name = artist.name;
                                count.url = artist.url;
                                count.img = artist.img;
                            }
                        });

                    });
                    deferred.resolve(countResults);
                },function(err){
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        recommendByTagNeo4j: function (id) {
            var deferred = Q.defer();
            var randomTag = {
                "query": "MATCH (a:Artist)-[tw:TAGGED_WITH]->(t:Tag) WHERE rand() < 0.8 AND tw.userid={uid} RETURN t.id,t.description LIMIT 1",
                "params": {
                    "uid": id
                }
            }
            neo4j.cypherRequest(randomTag)
                .then(function(res){
                    var tag;
                    if(res.body.data.length>0){
                        tag = {
                            _id: res.body.data[0][0],
                            description: res.body.data[0][1]
                        };
                        var query = {
                            "query": "MATCH (a:Artist)-[tw:TAGGED_WITH]->(t:Tag),(u:User)-[l:LISTEN]->(a),(b:User) " +
                            "WHERE t.id={tid} AND b.id={uid} AND NOT((a)<-[:LISTEN]-(b)) "+
                            "RETURN a.id,a.img,a.name,a.url,count(l) LIMIT 5",
                            "params":{
                                tid: tag._id.toString(),
                                uid: id.toString()
                            }
                        }
                        return neo4j.cypherRequest(query);
                    }else{
                        deferred.resolve({});
                    }

                })
                .then(function(res){
                    var results = []
                    if(res){
                        res.body.data.forEach(function(artist){
                            results.push({
                                _id: artist[0],
                                img: artist[1],
                                name: artist[2],
                                url: artist[3],
                                count: artist[4]
                            })
                        });
                        deferred.resolve(results);
                    }
                },function(err){
                    deferred.reject(err);
                })
            return deferred.promise;
        },
        recommendByTagPolyglot: function(id){
            var deferred = Q.defer();
            var promise = Artist.model.aggregate(
                {$unwind: "$tags"},
                {$match: {"tags.userid": Number(id)}},
                {$group: {_id: "$tags._id"}}).exec();
            promise
                .then(function(tags){
                    var n = tags.length;
                    var r = Math.floor(Math.random() * n);
                    var randomTag = tags[r];
                    return Artist.model.find({"tags._id": randomTag._id}).exec();
                })
                .then(function(artists){
                    var artistsIds=[];
                    artists.forEach(function(artist){
                        artistsIds.push(artist._id);
                    })
                    var artistsArray = ArtistSchema.methods.getArtistsStringByArray(artistsIds);
                    var query = {
                        "query": "MATCH (u:User)-[l:LISTEN]->(a:Artist),(b:User) WHERE a.id IN ["+artistsArray+"] " +
                                 "AND NOT((a)<-[:LISTEN]-(b)) AND b.id={uid} RETURN a.id,a.img,a.name,a.url,count(l) as count " +
                                 "ORDER BY count DESC LIMIT 5 ",
                        "params":{
                            uid: id.toString()
                        }
                    }
                    return neo4j.cypherRequest(query)
                })
                .then(function(res){
                    var results = [];
                    res.body.data.forEach(function(count){
                        results.push({
                            _id: count[0],
                            img: count[1],
                            name: count[2],
                            url: count[3],
                            count: count[4]
                        });
                    })
                    deferred.resolve(results);
                },function(err){
                    deferred.reject(err);
                })
            return deferred.promise;

        },
        formatArtistsCountByIds: function (data) {
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
                            if (count._id == artist.id) {
                                count.name = artist.name;
                                count.img = artist.img;
                                count.url = artist.url;
                            }

                        });
                    });
                    deferred.resolve(currentCount);
                }, function (error) {
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
                .then(function (data) {
                    return ArtistSchema.methods.formatArtistsCountByIds(data);
                })
                .then(function (data) {
                    deferred.resolve(data);
                }, function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        rankTopFiveArtistsByListeningCountNeo4j: function(){
            var query = {
                "query": "MATCH (u:User)-[l:LISTEN]->(a:Artist) " +
                         "RETURN a.id,a.name,SUM(l.count) as count ORDER BY count DESC LIMIT 5",
            };
            var deferred = Q.defer();
            neo4j.cypherRequest(query)
                .then(function(res){
                    var result = [];
                    res.body.data.forEach(function(artist){
                        result.push({
                            _id: artist[0],
                            name: artist[1],
                            count: artist[2]
                        });
                        deferred.resolve(result);
                    },function(err){
                        deferred.reject(err)
                    });
                });
            return deferred.promise;
        },
        rankTopFiveArtistsByUserCountMongoDB: function () {
            var deferred = Q.defer();
            var promise = User.model.aggregate(
                {$unwind: "$artists"},
                {$group: {_id: "$artists._id", count: {$sum: 1}}},
                {$sort: {count: -1}},
                {$limit: 5}).exec();
            promise
                .then(function (data) {
                    return ArtistSchema.methods.formatArtistsCountByIds(data);
                })
                .then(function (data) {
                    deferred.resolve(data);
                }, function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;
        },
        rankTopFiveArtistsByUserCountNeo4j: function () {
            var query = {
                "query": "MATCH (u:User)-[l:LISTEN]->(a:Artist) " +
                "RETURN a.id,a.name,count(l) as count ORDER BY count DESC LIMIT 5",
            };
            var deferred = Q.defer();
            neo4j.cypherRequest(query)
                .then(function(res){
                    var result = [];
                    res.body.data.forEach(function(artist){
                        result.push({
                            _id: artist[0],
                            name: artist[1],
                            count: artist[2]
                        });
                        deferred.resolve(result);
                    },function(err){
                        deferred.reject(err)
                    });
                });
            return deferred.promise;
        },
        rankTopFiveArtistsByGivenTagNeo4j: function (tagid) {
            var deferred = Q.defer();
            var qry = {
                "query": "MATCH (u:User)-[l:LISTEN]->(a:Artist)-[:TAGGED_WITH]->(t:Tag) WHERE t.id={id} " +
                "RETURN a.id,a.name,a.url,a.img,SUM(l.count) as count ORDER BY count DESC LIMIT 5",
                "params": {
                    id: tagid.toString()
                }
            }
            neo4j.cypherRequest(qry)
                .then(function (res) {
                    var result = [];
                    res.body.data.forEach(function(artist){
                        result.push({
                            _id: artist[0],
                            name: artist[1],
                            count: artist[4]
                        });
                        deferred.resolve(result);
                    },function(err){
                        deferred.reject(err);
                    });

                });
            return deferred.promise;
        },
        rankTopFiveArtistsByGivenTagMongoDB: function (tagid) {
            var deferred = Q.defer();
            var promise = Artist.model.find({"tags._id": tagid}, {_id: 1, name: 1}).exec();
            var artistsGroup = [];
            var artists;
            promise
                .then(function (data) {
                    artists = data;
                    data.forEach(function (art) {
                        artistsGroup.push(Number(art._id));
                    });
                    return User.model.aggregate(
                        {$unwind: "$artists"},
                        {$match: {"artists._id": {$in: artistsGroup}}},
                        {$group: {_id: "$artists._id", count: {$sum: "$artists.count"}}},
                        {$sort: {count: -1}},
                        {$limit: 5}).exec();

                }).then(function (data) {
                    var result = [];
                    artists.forEach(function (artist) {
                        data.forEach(function (count) {
                            if (count._id === artist._id) {
                                result.push({
                                    _id: artist._id,
                                    name: artist.name,
                                    count: count.count
                                })
                            }
                        })
                    })
                    deferred.resolve(result);
                });

            return deferred.promise;
        },
        rankTopFiveArtistsByGivenTagPolyglot: function(tagid){
            var deferred = Q.defer();
            var promise = Artist.model.find({"tags._id": tagid}, {_id: 1, name: 1}).exec();
            var artistsGroup = [];
            var artists;
            promise
                .then(function (data) {
                    artists = data;
                    data.forEach(function (art) {
                        artistsGroup.push(Number(art._id));
                    });
                    var artistStringArray = ArtistSchema.methods.getArtistsStringByArray(artistsGroup);
                    var qry = {
                        "query": "MATCH (u:User)-[l:LISTEN]->(a:Artist) WHERE a.id in["+artistStringArray+"] "+
                        "RETURN a.id,a.name,a.url,a.img,SUM(l.count) as count ORDER BY count DESC LIMIT 5"
                    }
                    return neo4j.cypherRequest(qry);

                }).then(function (res) {
                    var result = [];
                    res.body.data.forEach(function(artist){
                        result.push({
                            _id: artist[0],
                            name: artist[1],
                            url: artist[2],
                            img: artist[3],
                            count: artist[4]
                        })
                    });
                    deferred.resolve(result);
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
