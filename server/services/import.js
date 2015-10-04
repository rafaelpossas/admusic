/**
 * Created by rafaelpossas on 18/09/15.
 */
var importfiles = function(){

    var Q = require('q');
    var fs = require('fs');
    var Artist = require("../models/Artist");
    var Tag = require("../models/Tag");
    var User = require("../models/User");
    var neo4j = require("./neo4j");
    var allArtists = [];
    var objectTaggedArtistArray = [];
    var taggedArtists = [];

    var readFileAsync = function(name,type){
        return Q.nfcall(fs.readFile,name,type);
    }
    var getArtistsFromUser = function(id,array){
        var artists = [];
        array.forEach(function(data){
            var current = data.split('\t');
            if(current[0] !== 'userID' && current[0] === id){
                artists.push({
                    _id: current[1],
                    count: current[2]
                });
            }
        });
        return artists;
    };
    var getFriendsFromUser = function(id,array){
        var friends = [];
        array.forEach(function(data){
            var current = data.split('\t');
            if(current[0] !== 'userID' && current[0] === id){
                friends.push(current[1]);
            }
        });
        return friends;
    }
    var getTagByArtist = function(id,array){
        var tagsByArtist = [];
        array.forEach(function(data){
            if(data.artistid == id){
                delete data.artistid;
                tagsByArtist.push(data);
            }
        })
        return tagsByArtist;
    }


    var importTags = function(file){
        var deferred = Q.defer();
        var promise = Q.ninvoke(Tag.model,"find",{});
        var isImported = false;
        var objectTagsArray = [];
        promise
            .then(function(col){
                if(col.length === 0){
                    return readFileAsync(file,'utf8')
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
                        return Q.ninvoke(Tag.model,"create",data);
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
                    return neo4j.statementRequest(data);
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
    }
    var importTagsRelationships = function (filename){


        var promise =  readFileAsync(filename,'utf8');
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
                                _id: current[2],
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
                            var tagsByArtist = getTagByArtist(artist._id,objectTaggedArtistArray);
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
                                'WHERE t.id="'+tag._id+'" AND a.id="'+artist._id+'" '+
                                'CREATE (a)-[:TAGGED_WITH {userid: '+ tag.userid+' }]->(t)'
                            };
                            data.push(stm);
                        }

                    })
                })
                return neo4j.statementRequest(data);
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
    }
    var importArtists = function () {
        var deferred = Q.defer();
        var allArtists = [];
        var promise = Q.ninvoke(Artist.model, "find", {});
        var isImported = false;
        promise
            .then(function (col) {
                if (col.length === 0) {
                    return readFileAsync('./data/artists.dat', 'utf8')
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
                        return Q.ninvoke(Artist.model, "create", data);
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

                    return neo4j.statementRequest(data);
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
    }

    var importUsers = function (file1,file2) {
        var deferred = Q.defer();
        var isImported = false;
        var stringUserArray = [];
        var objectUserArray = [];
        var stringFriendsArray = [];

        var promise = Q.ninvoke(User.model,"find",{});

        promise
            .then(function(col){
                if(col.length === 0){
                    return readFileAsync(file1,'utf8')
                }else{
                    isImported = true;
                }
            })
            .then(function(data){
                if(data && !isImported) {
                    stringUserArray = data.split('\r\n');
                    var savedUsers = []
                    stringUserArray.forEach(function (data) {
                        var current = data.split('\t');
                        if (current[0] !== 'userID' && current[0] !== '') {
                            if (savedUsers.indexOf(current[0]) < 0) {
                                var newUser = {
                                    _id: current[0],
                                    email: "datamodels"+current[0]+"@sydney.edu.au",
                                    password: "adm"
                                };
                                savedUsers.push(current[0]);
                                objectUserArray.push(newUser);

                            }

                        }
                    });
                    return readFileAsync(file2,'utf8')
                }
            })

            .then(function(data){
                if(data && !isImported){
                    stringFriendsArray = data.split('\r\n');
                    objectUserArray.forEach(function(user){
                        user.artists = getArtistsFromUser(user._id,stringUserArray);
                        user.friends = getFriendsFromUser(user._id,stringFriendsArray);
                    });
                    var promises = objectUserArray.map(function(data){
                        return Q.ninvoke(User.model,"create",data);
                    });
                    return Q.all(promises);
                }

            })

            .then(function(){
                if(!isImported) {
                    var data = [];
                    objectUserArray.forEach(function(user){
                        var stm = {
                            "statement":  'CREATE (u:User {user})',
                            "parameters": {
                                "user": {
                                    "id": user._id,
                                    "email": "datamodels"+user._id+"@sydney.edu.au",
                                    "password": "adm"
                                }
                            }
                        };
                        data.push(stm);

                    });
                    return neo4j.statementRequest(data);
                }
            }).then(function(){
                if(!isImported){
                    var data = [];
                    objectUserArray.forEach(function(user){
                        user.friends.forEach(function(friend){
                            if(user && friend){
                                var stm = {
                                    "statement": 'MATCH (u:User),(f:User) ' +
                                    'WHERE u.id="'+user._id+'" AND f.id="'+friend+'" '+
                                    'CREATE (u)-[:FRIEND]->(f)'
                                };
                                data.push(stm);
                            }
                        });

                    });
                    return neo4j.statementRequest(data);
                }
            })
            .then(function(){
                if(!isImported){
                    var data = []
                    objectUserArray.forEach(function(user){
                        user.artists.forEach(function(artist){
                            if(user && artist){
                                var stm = {
                                    "statement": 'MATCH (u:User),(a:Artist) ' +
                                    'WHERE u.id="'+user._id+'" AND a.id="'+artist._id+'" '+
                                    'CREATE (u)-[:LISTEN {count: '+artist.count+'}]->(a)'
                                };
                                data.push(stm);
                            }

                        })
                    })
                    return neo4j.statementRequest(data);
                }
            })
            .then(function(res){
                console.log("All users were saved")
                deferred.resolve(res)
            })
            .catch(function(error){
                deferred.reject(error);
            }).done();

        return deferred.promise;

    }
    return{
        readFileAsync: readFileAsync,
        getFriendsFromUser: getFriendsFromUser,
        getArtistsFromUser: getArtistsFromUser,
        getTagByArtist: getTagByArtist,
        importTags: importTags,
        importTagsRelationships: importTagsRelationships,
        importArtists: importArtists,
        importUsers: importUsers
    }

}();

module.exports = importfiles;