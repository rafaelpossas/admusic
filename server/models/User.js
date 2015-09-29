/**
 * Created by rafaelpossas on 3/27/15.
 */

var User = function () {
    var mongoose = require('mongoose'),
        enc = require('../utilities/encryption');
    var Q = require('q');
    var iutil = require('../services/import')

    var ArtistData = mongoose.Schema({
        _id: Number,
        count: {type: Number}
    });
    var UserSchema = mongoose.Schema({
        _id: Number,
        email: {type: String, required: '{PATH} is required'},
        password: {type: String, required: '{PATH} is required'},
        salt: String,
        token: String,
        artists: [ArtistData],
        friends: [String]
    });

    UserSchema.methods = {
        importUserData: function (file1,file2) {
            var deferred = Q.defer();
            var isImported = false;
            var stringUserArray = [];
            var objectUserArray = [];
            var stringFriendsArray = [];

            var promise = Q.ninvoke(_model,"find",{});

            promise
                .then(function(col){
                    if(col.length === 0){
                        return iutil.readFileAsync(file1,'utf8')
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
                                        email: "datamodels@sydney.edu.au",
                                        password: "adm"
                                    };
                                    savedUsers.push(current[0]);
                                    objectUserArray.push(newUser);

                                }

                            }
                        });
                        return iutil.readFileAsync(file2,'utf8')
                    }
                })

                .then(function(data){
                    if(data && !isImported){
                        stringFriendsArray = data.split('\r\n');
                        objectUserArray.forEach(function(user){
                            user.artists = iutil.getArtistsFromUser(user._id,stringUserArray);
                            user.friends = iutil.getFriendsFromUser(user._id,stringFriendsArray);
                        });
                        var promises = objectUserArray.map(function(data){
                            return Q.ninvoke(_model,"create",data);
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
                                        "email": "datamodels@sydney.edu.au",
                                        "password": "adm"
                                    }
                                }
                            };
                            data.push(stm);

                        });
                        return iutil.statementRequest(data);
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
                        return iutil.statementRequest(data);
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
                                        'CREATE (u)-[:LIKE {count: '+artist.count+'}]->(a)'
                                    };
                                    data.push(stm);
                                }

                            })
                        })
                        return iutil.statementRequest(data);
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

        },
        friend: function(user1_id,user2_id){
            var deferred = Q.defer();
            var query = {
                "query": 'MATCH (u:User),(f:User) ' +
                'WHERE u.id={id1} AND f.id={id2} '+
                'CREATE (u)-[r1:FRIEND]->(f),(f)-[r2:FRIEND]->(u) RETURN r1,r2',
                "params":{
                    id1: user1_id.toString(),
                    id2: user2_id.toString()
                }
            };
            iutil.cypherRequest(query)
                .then(function(res){
                    if(res.body.data[0].length == 2){
                        var result = [];
                        result.push(res.body.data[0][0].metadata);
                        result.push(res.body.data[0][1].metadata);
                        deferred.resolve(result);
                    }else{
                        deferred.reject("Could create the relationship between User: "+user1_id+" and User: "+user2_id);
                    }
                },function(err){
                    deferred.reject(err);
                });
            return deferred.promise;

        },
        findById: function(id){
            var deferred = Q.defer();
            var query = {
                query: "MATCH (u:User) WHERE u.id={id} RETURN u",
                params:{
                    id: id.toString()
                }
            }
            iutil.cypherRequest(query)
                .then(function(res){
                    if(res.body.data.length>0){
                        deferred.resolve(res.body.data[0][0].data);
                    }else{
                        deferred.reject("Could not find User with id: "+id);
                    }
                })
            return deferred.promise;

        },
        findAllUserFriends: function(userId){
            var deferred = Q.defer();
            var query = {
                query: "MATCH (u:User),(f:User),(u)-[:FRIEND]->(f) WHERE u.id={id} RETURN f",
                params:{
                    id: userId.toString()
                }
            }
            iutil.cypherRequest(query)
                .then(function(res){
                    var result = [];
                    res.body.data.forEach(function(dt){
                        result.push(dt[0].data);
                    });
                    deferred.resolve(result);
                },function(error){
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        comparePasswords: function (password) {
            if (enc.hashPwd(this.salt, password) === this.password) {
                return true;
            }
            else {
                return false
            }
        },
        toJSON: function () {
            var user = this.toObject();
            delete user.password;
            delete user.salt;
            return user;
        }
    };

    UserSchema.pre('save', function (next) {
        var user = this;
        if (!user.isModified('password')) return next();
        else
            user.salt = enc.createSalt();

        user.password = enc.hashPwd(user.salt, user.password);

        next();

    });

    var _model = mongoose.model('User', UserSchema);

    return {
        model: _model,
        schema: UserSchema
    }

}();


module.exports = User;
