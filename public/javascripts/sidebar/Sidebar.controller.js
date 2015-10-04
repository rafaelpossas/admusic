app.controller('sidebarCtrl', ['$scope','$location',function ($scope,$location) {

    $scope.getArtists = function(){
        $location.path('/artists');
    }
    $scope.getFriends = function(){
        $location.path('/friends');
    }
    $scope.getProfile = function(){
        $location.path('/');
    }
    $scope.logout = function(){
        $location.path('/logout');
    }

}]);
