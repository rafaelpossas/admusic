/**
 * Created by rafaelpossas on 3/27/15.
 */

var User = function () {
    var mongoose = require('mongoose'),
        enc = require('../utilities/encryption');
    var Q = require('q');
    var neo4j = require('../services/neo4j')

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
        friend: function (user1_id, user2_id) {
            var deferred = Q.defer();
            var query = {
                "query": 'MATCH (u:User),(f:User) ' +
                'WHERE u.id={id1} AND f.id={id2} ' +
                'CREATE (u)-[r1:FRIEND]->(f),(f)-[r2:FRIEND]->(u) RETURN r1,r2',
                "params": {
                    id1: user1_id.toString(),
                    id2: user2_id.toString()
                }
            };
            neo4j.cypherRequest(query)
                .then(function (res) {
                    if (res.body.data[0].length == 2) {
                        var result = [];
                        result.push(res.body.data[0][0].metadata);
                        result.push(res.body.data[0][1].metadata);
                        deferred.resolve(result);
                    } else {
                        deferred.reject("Could create the relationship between User: " + user1_id + " and User: " + user2_id);
                    }
                }, function (err) {
                    deferred.reject(err);
                });
            return deferred.promise;

        },
        findById: function (id) {
            var deferred = Q.defer();
            var query = {
                query: "MATCH (u:User) WHERE u.id={id} RETURN u",
                params: {
                    id: id.toString()
                }
            }
            neo4j.cypherRequest(query)
                .then(function (res) {
                    if (res.body.data.length > 0) {
                        deferred.resolve(res.body.data[0][0].data);
                    } else {
                        deferred.reject("Could not find User with id: " + id);
                    }
                })
            return deferred.promise;

        },
        findAllUserFriends: function (userId) {
            var deferred = Q.defer();
            var query = {
                query: "MATCH (u:User),(f:User),(u)-[:FRIEND]->(f) WHERE u.id={id} RETURN f",
                params: {
                    id: userId.toString()
                }
            }
            neo4j.cypherRequest(query)
                .then(function (res) {
                    var result = [];
                    res.body.data.forEach(function (dt) {
                        result.push(dt[0].data);
                    });
                    deferred.resolve(result);
                }, function (error) {
                    deferred.reject(error);
                });
            return deferred.promise;
        },
        findAllNonUserFriends: function (id) {
            var deferred = Q.defer();
            var query = {
                query: "MATCH (u:User),(f:User) WHERE NOT (u)-[:FRIEND]->(f) AND u.id={id} AND NOT f.id={id} RETURN f",
                params: {
                    id: id.toString()
                }
            }
            neo4j.cypherRequest(query)
                .then(function (res) {
                    var result = [];
                    res.body.data.forEach(function (dt) {
                        result.push(dt[0].data);
                    });
                    deferred.resolve(result);
                }, function (error) {
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
            delete user.artists;
            delete user.friends;
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
