var app = angular.module('procymo-admin', ['ngRoute', 'ngAnimate']);

(function () {

    app.config(function ($routeProvider, $locationProvider, $httpProvider) {

        $locationProvider.html5Mode({enabled: true, requireBase: false});

        var routeRoleChecks = {
            user: {
                auth: function (auth) {
                    return auth.authenticateUserForRoute();
                }
            }
        }
        $routeProvider
            .when("/", {templateUrl: '/html/main/main.html', controller: 'mainCtrl', resolve: routeRoleChecks.user})
            .when("/register", {templateUrl: '/html/account/register.html', controller: 'registerCtrl'})
            .when("/logout", {templateUrl: '/html/main/main.html', controller: 'logoutCtrl'})
            .when("/friends", {templateUrl: '/html/users/friends.html', controller: 'usersCtrl', resolve: routeRoleChecks.user})
            .when("/artists", {templateUrl: '/html/artists/artists.html', controller: 'artistsCtrl', resolve: routeRoleChecks.user})
            .when("/login", {templateUrl: '/html/account/login.html', controller: 'loginCtrl'})
            .otherwise({redirectTo: '/'});

        $httpProvider.interceptors.push('authInterceptor');
    })
        .constant('API_URL', 'http://localhost:3000/');


    app.run(function ($rootScope, $location, $window,authToken) {
        $rootScope.$on('$routeChangeError', function (evt, current, previous, rejection) {
            if (rejection === 'not authorized') {
                $location.path('/login');
            }
            /* Act on the event */
        })
        $rootScope.user = (function(){
            var userString =  $window.localStorage.getItem('user');
            return JSON.parse(userString);
        })()
        $rootScope.isAuthenticated = authToken.isAuthenticated();

    });


})();