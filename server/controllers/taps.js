/**
 * Created by rafaelpossas on 5/09/15.
 */
/**
 * Created by rafaelpossas on 2/09/15.
 */

var TapsController = function(){
    var Tap = require('../models/Tap');

    var getTaps = function(req,res,next){
        Tap.model.find({}).exec(function(err,collection){
            if(err) next(err);
            else
                res.status(200).send(collection);
        });
    }
    var checkInterval = function(taps,currentTap,interval){
        var isTapOk = true;
        taps.forEach(function(tap){
            if(tap.hour === currentTap.hour
                && tap.minutes >= currentTap.minutes && tap.uid === currentTap.uid){
                isTapOk = false;
                return;
            }
        });
        return isTapOk;
    }
    var createTap = function(uid){
        var now = new Date();
        return {uid:uid,hour: now.getHours(),minutes:now.getMinutes()}
    }
    var saveTap = function(req,res,next){
        var uid = req.body.uid;
        var promise = Tap.schema.methods.findWithinDay(new Date());
        promise.then(function(doc){
            try{
                var currentTap = createTap(uid);
                var isIntervalOk = checkInterval(doc[0].tapData,currentTap,5);
                res.status(200).send({status: isIntervalOk});
            }catch(e){
                res.status(500).send({message:e});
            }


        },function(err){
            next(err);
        })

    }
    return {
        getTaps: getTaps,
        saveTap: saveTap
    }
}();

module.exports = TapsController;