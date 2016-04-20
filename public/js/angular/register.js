angular.module('register', [])
    .controller('registerModule', function ($scope, registerContentService, $http, $window, $timeout) {
        $scope.userInfo = {};
        $scope.step1 = false;
        $scope.step2 = false;
        $scope.results = false;
        $scope.result = {};

        registerContentService.getUser().then(
            function (components) {
                $scope.userInfo = components;
                if (jQuery.isEmptyObject($scope.userInfo)) {
                    $scope.step1 = true;
                    $scope.step2 = false;
                } else {
                    $scope.step1 = false;
                    $scope.step2 = true;
                }
            },
            function (error) {
                console.log(error);
            });

        $scope.register = function () {
            if ($scope.step2) {
                var factory = {
                    factoryName: $scope.factoryName,
                    username: $scope.userInfo.username,
                    email: $scope.userInfo.email
                };

                $http.post('/register', angular.toJson(factory))
                    .success(function () {
                        alert('Successfully registered. You are going to be redirected to the login page.');
                        $window.location.href = "/";


                    })
                    .error(function (error) {
                        alert(error);
                    });
            } else
                return false;
        }
    })

    .factory('registerContentService', function ($q, $http) {
        return {
            getUser: function () {
                var deferred = $q.defer(),
                    httpPromise = $http.get('/register/userData');

                httpPromise.success(function (components) {
                        deferred.resolve(components);
                    })
                    .error(function (error) {
                        console.log(error);
                        return null;
                    });

                return deferred.promise;
            }
        };
    })

    .config(['$httpProvider', function ($httpProvider) {
        //initialize get if not there
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }

        // Answer edited to include suggestions from comments
        // because previous version of code introduced browser-related errors

        //disable IE ajax request caching
        $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
        // extra
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    }]);