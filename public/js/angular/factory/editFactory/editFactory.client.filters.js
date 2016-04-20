angular.module('factoryEditPage')
    .filter('randomSrc', function () {
        return function (input) {
            if (input)
                return input + '?r=' + Math.round(Math.random() * 999999);
        }
    })
    .filter('recurringType', function () {
        return function (input) {
            if (input == 1)
                return "Daily";
            if (input == 2)
                return "Weekly";
            if (input == 3)
                return 'Monthly'
        }
    })
    .filter('materialsArray', function () {
        return function (input) {
            if (!input)
                return "";

            if (input.length > 0)
                return input.join(', ');

            else return "";
        }
    });