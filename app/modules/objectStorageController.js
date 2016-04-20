var request = require('request'),
    fs = require('fs');

module.exports = {
    uploadFile: function (file, callback) {
        getAuthorization(function (err, access) {
            if (!err) {
                //upload the fucking file!
                var url = access.accessUrl + "/orders/" + file.serverName;
                var fStream = fs.createReadStream(file.path);

                var req = request.put({
                    url: url,
                    headers: {
                        'x-auth-token': access.accessToken
                    }
                }, function optionalCallback(err, httpResponse, body) {
                    if (err) {
                        return console.error('upload failed:', err);
                        callback(err, httpResponse, body);
                    }
                    console.log('httpResponse: \n' + JSON.stringify(httpResponse));
                    console.log('Upload successful!  Server responded with:', body);
                    callback(null, file.serverName);
                });
                fStream.pipe(req);
            }
            else
                callback(err);
        });
    },

    getAccessToFile: function (file, callback) {
        getAuthorization(function (err, access) {
            if (!err) {
                callback(null, access);
            } else {
                callback(err);
            }
        });
    }
};

function getInitialToken(callback) {
    var url = "http://cloud.lab.fiware.org:4730/v2.0/tokens";
    var req = {
        "auth": {
            "passwordCredentials": {
                "username": "feedback@bluemind-software.ro",
                "password": "fiwarepass1"
            }
        }
    };
    request({
        url: url,
        method: "POST",
        body: req,
        json: true,
        headers: {
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        var token = "";
        if (error) {
            return callback(error, null);
        }
        token = body.access.token.id;

        callback(error, token);
    });
}
function getTenant(initToken, callback) {

    request({
        url: "http://cloud.lab.fiware.org:4730/v2.0/tenants",
        method: "GET",
        headers: {
            "x-auth-token": initToken
        },
        json: true
    }, function (error, response, body) {
        var tenant = "";
        if (error)
            return callback(error, null);
        else {
            tenant = body.tenants[0].id;
            callback(error, tenant);
        }
    });
}
function getObjectStorageTenant(tenantId, callback) {
    var url = "http://cloud.lab.fiware.org:4730/v2.0/tokens";
    var req = {
        "auth": {
            "passwordCredentials": {
                "username": "feedback@bluemind-software.ro",
                "password": "fiwarepass1"
            },
            "tenantId": tenantId
        }
    };

    request({
        url: url,
        method: "POST",
        body: req,
        json: true,
        headers: {
            'Content-Type': 'application/json'
        }
    }, function (error, response, body) {
        var accessToken = "";
        var accessUrl = "";
        if (!error) {
            accessToken = body.access.token.id;
            var sCat = body.access.serviceCatalog;

            for (i = 0; i < sCat.length; i++) {
                if (sCat[i].name == 'swift') {
                    var endPoints = sCat[i].endpoints;
                    for (j = 0; j < endPoints.length; j++) {
                        if (endPoints[j].region == 'Spain2') {
                            accessUrl = endPoints[j].publicURL;
                            break;
                        }

                    }
                }
            }
            callback(error, accessToken, accessUrl);
        } else {
            callback(error);
        }

    });
}
function getAuthorization(callback) {
    getInitialToken(function (error, token) {
        if (!error && token) {
            getTenant(token, function (err, tenant) {
                    if (!err && tenant) {
                        getObjectStorageTenant(tenant, function (err, accessToken, accessUrl) {
                            if (!err) {
                                var access = {
                                    accessToken: accessToken,
                                    accessUrl: accessUrl
                                };

                                console.log(access);
                                callback(err, access);
                            }

                            else
                                callback(err, null);
                        });
                    }
                    else {
                        callback();
                    }
                }
            );
        } else {
            callback();
        }
    });
}
function setupFolder(access, clientId, callback) {
    request({
        url: access.accessUrl + "/" + clientId,
        method: "GET",
        headers: {
            "x-auth-token": access.accessToken
        },
        json: true
    }, function (error, response, body) {
        if (response.statusCode == 404) {
            request({
                url: access.accessUrl + "/" + clientId,
                method: "PUT",
                headers: {
                    "x-auth-token": access.accessToken
                },
                json: true
            }, function (error, response, body) {
                callback(response.statusCode);
            });
        } else {
            callback(response.statusCode);
        }
    });
}