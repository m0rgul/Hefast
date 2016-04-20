(function () {
    var app = angular.module('registerModule', ['ngMessages']);

    app.controller('registerCtrl', registerCtrl);
    registerCtrl.$inject = ['$scope', '$http'];

    function registerCtrl($scope, $http) {
        $scope.trySubmit = false;
        $scope.isSaving = false;

        $scope.register = function () {
            if ($scope.registerForm.$invalid) {
                $scope.trySubmit = true;
                return;
            }

            $http.post('/register', angular.toJson($scope.user))
                .then(
                    function success(result) {
                        console.log(result);
                    },
                    function error(err) {
                        console.log(err);
                    });
        };
    }
})();