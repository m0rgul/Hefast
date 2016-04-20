angular.module('registerUser', [])
    .controller('registerUserModule', function ($scope, registerContentService, $http, $window) {
        $scope.newUser = {};
        $scope.userInfo = {};
        registerContentService.getUser().then(
            function (components) {
                $scope.userInfo = components;
            },
            function (error) {
                console.log(error);
            });

        $scope.register = function () {
            var user = {
                fullName: $scope.newUser.fullName,
                address: $scope.newUser.address,
                phoneNo: $scope.newUser.phoneNo
            };

            $http.post('/clients', angular.toJson(user))
                .success(function () {
                    alert('Successfully registered. You will now be redirected to the login page.');
                    $window.location.href = '/';
                })
                .error(function (error) {
                    alert(error);
                });
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
        if (!$httpProvider.defaults.headers.get) {
            $httpProvider.defaults.headers.get = {};
        }
        $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
        $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';
    }]);