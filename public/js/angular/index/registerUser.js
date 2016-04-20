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

            $http.post('/clients', angular.toJson($scope.user))
                .then(
                    function success(result) {
                        if (result.status == 201)
                            window.location.href = "/";
                        else alert('Error: ' + result.status + ' -> ' + result.statusText);
                    },
                    function error(err) {
                        alert('Error: ' + err.status + ' -> ' + err.statusText);
                    });
        };
    }
})();