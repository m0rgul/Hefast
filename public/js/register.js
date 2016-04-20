(function () {
    var emailFlag = true;
    var userFlag = true;
    $(document).ready(function () {
        $('#email').blur(function () {
            if ($('#email').val() != '') {
                console.log();
                //check if email is not already used
                $.ajax({
                    url: '/register/checkEmail',
                    data: {'email': $('#email').val()},
                    method: 'POST',
                    success: function (data) {
                        if (data.code == 1) {
                            $('#errorMessage').removeClass().addClass('ok').html(data.message);
                        }
                        if (data.code == 0) {
                            $('#errorMessage').removeClass().addClass('error').html(data.message);
                            emailFlag = false;
                        }
                    },
                    error: function (data) {
                        $('#errorMessage').removeClass().addClass('error').html(data.message);
                    }
                });
            }
        });

        $('#username').blur(function () {
            if ($('#username').val() != '') {
                $.ajax({
                    url: '/register/checkUsername',
                    data: {'username': $('#username').val()},
                    method: 'POST',
                    success: function (data) {
                        if (data.code == 1) {
                            $('#errorMessage').removeClass().addClass('ok').html(data.message);
                            userFlag = true;
                        }
                        if (data.code == 0) {
                            $('#errorMessage').removeClass().addClass('error').html(data.message);
                            userFlag = false;
                        }
                    },
                    error: function (data) {
                        $('#errorMessage').removeClass().addClass('error').html(data.message);
                    }
                });
            }
        });

        $('form').submit(function (event) {
            if (emailFlag && userFlag) {
                var formData = {
                    'factoryName': $('input[name=factoryName]').val(),
                    'factoryAddress': $('input[name=factoryAddress]').val(),
                    'email': $('input[name=email]').val(),
                    'username': $('input[name=username]').val(),
                    'password': $('input[name=password]').val()
                };
                $.ajax({
                    url: '/registerFactory',
                    data: formData,
                    method: 'POST',
                    success: function (data) {
                        window.location.href = '/';

                    },
                    error: function (data) {

                    }
                });

            } else {
                if (!emailFlag) {
                    $('#email').focus();
                    $('#errorMessage').removeClass().addClass('error').html('Please enter a valid email.');
                }
                if (!userFlag) {
                    $('#username').focus();
                    $('#errorMessage').removeClass().addClass('error').html('Please enter a valid username.');
                }
            }

            event.preventDefault();
        });
    });
})();