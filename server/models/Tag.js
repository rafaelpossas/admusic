var Tag = function(){
    var mongoose = require('mongoose');
    var fs = require('fs');
    var Q = require('q');

    var neo4j = require('../services/neo4j');

    var TagSchema = mongoose.Schema({
        _id: Number,
        description: {type:String,required: '{PATH} is required'}
    });
    var _model = mongoose.model('Tag',TagSchema);

    TagSchema.methods = {
        getAllTags: function(){
            var deferred = Q.defer();
            _model.find({}).sort({description:1}).exec()
                .then(function(data){
                    deferred.resolve(data);
                },function(err){
                    deferred.reject(err);
                });

            return deferred.promise;
        }

    };


    return{
        model: _model,
        schema: TagSchema
    }

}();


module.exports = Tag;
