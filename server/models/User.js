/**
 * Created by rafaelpossas on 3/27/15.
 */

var User = function () {
    var mongoose = require('mongoose'),
        enc = require('../utilities/encryption');
    var Q = require('q');
    var fs = require('fs');

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
        importUserData: function () {
            var readFileAsync = function(name,type){
                return Q.nfcall(fs.readFile,name,type);
            }
            var promise = _model.find({}).exec();
            var isImported = false;
            var stringUserArray = [];
            var objectUserArray = [];
            var stringFriendsArray = [];
            promise
                .then(function(col){
                    if(col.length === 0){
                        return readFileAsync('./data/user_artists.dat','utf8')
                    }else{
                        isImported = true;
                    }
                })
                .then(function(data){
                    if(data !== undefined) {
                        stringUserArray = data.split('\r\n');
                        var savedUsers = []
                        stringUserArray.forEach(function (data) {
                            var current = data.split('\t');
                            if (current[0] !== 'userID') {
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
                        return readFileAsync('./data/user_friends.dat','utf8')


                    }
                })
                .then(function(data){
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
                    if(data!= undefined){
                        stringFriendsArray = data.split('\r\n');
                        objectUserArray.forEach(function(user){
                            user.artists = getArtistsFromUser(user._id,stringUserArray);
                            user.friends = getFriendsFromUser(user._id,stringFriendsArray);
                            console.log(user);
                        });
                    }
                    var promises = objectUserArray.map(function(data){
                        return Q.ninvoke(_model,"create",data);
                    });
                    return Q.all(promises);

                })
                .then(function(){
                    console.log("All Users were saved");
                },function(err){
                    throw err;
                });

        },

        comparePasswords: function (password) {
            if (enc.hashPwd(this.salt, password) === this.password) {
                return true;
            }
            else {
                return false
            }
            ;
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
