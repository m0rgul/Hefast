(function () {
    var app = angular.module("factoryPayments", ['factoryNav']);

    app.controller('plansCtrl', function ($scope) {
        $scope.plans = [
            {
                plan: 1,
                value: 9.99,
                currency: 'EUR',
                subType: 1
            },
            {
                plan: 3,
                value: 14.99,
                currency: 'EUR',
                subType: 1
            },
            {
                plan: 5,
                value: 89.99,
                currency: 'EUR',
                subType: 1
            }
        ];

        $scope.selectPlan = function (plan) {
            $scope.selectedOption = $scope.plans[plan];
            if (!$scope.selectedOption || Object.keys($scope.selectedOption).length == 0)
                window.location.hash = '#/plans';

            var qString = [];
            Object.keys($scope.selectedOption).forEach(function (key) {
                console.log('key: %s, value: %s', key, $scope.selectedOption[key]);
                var str = key + "=" + $scope.selectedOption[key];
                qString.push(str);
            });
            var url = '/payments/create?' + qString.join('&');
            window.location.href = url;

        };
    });
})();