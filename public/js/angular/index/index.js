var app = angular.module('indexApp', ['ngMessages']);
(function () {
    app.controller('indexController', function ($scope, $http) {
        $scope.trySubmit = false;
        $scope.user = {};

        $scope.isSaving = false;
        $scope.result = {
            message: '',
            success: false
        };

        $scope.login = function () {
            if ($scope.loginForm.$invalid) {
                $scope.trySubmit = true;
                return false;
            }

            $scope.isSaving = true;
            $scope.result.message = '';

            var data = {
                username: $scope.user.username,
                password: /*forge_sha256($scope.user.password)*/$scope.user.password
            };

            $http.post('/auth/login', angular.toJson(data))
                .then(
                    function (response) {
                        $scope.result.success = response.status == 200;
                        $scope.result.message = response.data;

                        if ($scope.result.success) {
                            setTimeout(function () {
                                window.location.href = '/home';
                            }, 1000);
                        }
                        else {
                            $scope.isSaving = false
                        }

                    },
                    function (error) {
                        $scope.result.success = false;
                        $scope.result.message = error.data;
                        $scope.isSaving = false;
                    });
        };
    });
})();