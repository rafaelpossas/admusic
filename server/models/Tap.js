/**
 * Created by rafaelpossas on 3/09/15.
 */
/**
 * Created by rafaelpossas on 3/27/15.
 */

var Tap = function(){
    var mongoose = require('mongoose');

    var TapData =  mongoose.Schema({ uid: {type: String},
        hour: {type:Number,min:1,max:24},
        minutes:{type:Number,min:0,max:60}
    });

    var TapSchema = mongoose.Schema({
        date: {type:Date,required: '{PATH} is required'},
        tapData: [TapData]
    });

    TapSchema.methods = {
        findWithinDay: function(date){
            var nextday = new Date();
            nextday.setDate(date.getDate()+1)
            return _model.find({date:{$gte:date},date:{$lt:nextday}}).exec();
        },
    };

    var _model = mongoose.model('Tap',TapSchema);

    return{
        model: _model,
        schema: TapSchema
    }
}();


module.exports = Tap;
