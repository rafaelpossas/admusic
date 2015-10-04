/**
 * Created by rafaelpossas on 2/10/15.
 */
var neo4j = function(){
    var request = require('superagent');
    var Q = require('q');
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
        cleanNeo4j:cleanNeo4j,
        statementRequest:statementRequest,
        cypherRequest:cypherRequest

    }
}();

module.exports = neo4j;