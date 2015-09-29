/**
 * Created by rafaelpossas on 18/09/15.
 */
var importfiles = function(){

    var Q = require('q');
    var fs = require('fs');
    var request = require('superagent');

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

    var cleanNeo4j = function(){
        var stm = {
            "statement": 'MATCH (n) OPTIONAL MATCH (n)-[r]-() DELETE n,r'
        };
        var data = [];
        data.push(stm);
        return statementRequest(data);
    }

    var statementRequest = function(statementsArray){
        var data = {"statements":[]};
        var deferred = Q.defer();
        statementsArray.forEach(function(stm){
            data.statements.push(stm);
        });
        request
            .post(global.config.neo4j+"/db/data/transaction/commit")
            .set('Authorization', (global.config.neo4jtoken))
            .send(data)
            .end(function(err,res){
                if(err) deferred.reject(err);
                else if(res.body.errors && res.body.errors.length > 0) deferred.reject(res.body.errors[0].message)
                else deferred.resolve(res)

            })
        return deferred.promise;
    }
    var cypherRequest = function(query){
        var deferred = Q.defer();
        request
            .post(global.config.neo4j+"/db/data/cypher")
            .set('Authorization', (global.config.neo4jtoken))
            .send(query)
            .end(function(err,res){
                if(err) deferred.reject(err);
                else if(res.body.errors && res.body.errors.length > 0) deferred.reject(res.body.errors[0].message)
                else deferred.resolve(res)

            })
        return deferred.promise;
    }
    return{
        readFileAsync: readFileAsync,
        getFriendsFromUser: getFriendsFromUser,
        getArtistsFromUser: getArtistsFromUser,
        statementRequest: statementRequest,
        getTagByArtist: getTagByArtist,
        cleanNeo4j: cleanNeo4j,
        cypherRequest: cypherRequest
    }

}();

module.exports = importfiles;