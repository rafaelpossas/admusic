/**
 * Created by rafaelpossas on 2/10/15.
 */
app.controller('usersCtrl', ['$scope','$rootScope','$http','API_URL',function ($scope,$rootScope,$http,API_URL) {
    $scope.friends = [];
    $scope.all = [];

    (function(){
        $('.nav li a').removeClass('active');
        $('.nav li:nth-child(3) > a').addClass('active');
        getAll();
    })();

    function getAll(){
        var url = API_URL +"users/" + $rootScope.user._id+ '/friends';
        $http.get(url).success(function(friends){
            $scope.friends = friends;
        });
        var url_unk = API_URL +"users/" + $rootScope.user._id+ '/unknown';
        $http.get(url_unk).success(function(res){
            $scope.all = res;
        });
    }
    $scope.addFriend = function addFriend(id){
        var url = API_URL +"users/friend";
        $http.post(url,{user1: $rootScope.user._id,user2: id}).success(function(res){
           getAll();
        });
    }


}]);