var App = angular.module("App", ["ionic", "ngCordova"]);

App.service("zippcoin", ["$http", "$log", zippcoin]);

App.controller("UserCtrl", ["$scope", "$stateParams", "zippcoin", UserCtrl]);

function UserCtrl($scope, $stateParams, zippcoin) {
    console.log($scope.searchstr);
    $scope.searchstr = $stateParams.searchstr;
    console.log($scope.searchstr);
    zippcoin.findUser($scope.searchstr, $scope);
}

App.controller("TxnCtrl", ["$scope", "$stateParams", "zippcoin", TxnCtrl]);

function TxnCtrl($scope, $stateParams, zippcoin) {
    $scope.error = -1;
    console.log($stateParams.id);
    setTimeout(function () {
        zippcoin.transactionDetails($scope, $stateParams.id)
    }, 300);
}

App.controller("FindCtrl", ["$scope", "zippcoin", FindCtrl]);

function FindCtrl($scope, zippcoin) {
    $scope.randomUsers = function () {
        zippcoin.randomUsers($scope);
    }
    $scope.findUser = function () {
        zippcoin.findUser(document.getElementById("search_field").value, $scope);
    }

}

App.controller("SendCtrl", ["$scope", "$stateParams", "$q", "zippcoin", SendCtrl]);

function SendCtrl($scope, $stateParams, $q, zippcoin) {
    $scope.send_result = -1;

    $scope.errorOk = function () {
        $scope.send_result = -1;
    }
    
    if ($stateParams.id) {
        $scope.id = $stateParams.id;
        $scope.name = $stateParams.name;
        console.log($scope.id);
        $scope.send = function () {
            //auth, userid, otheruserid, amount, memo 
            zippcoin.createTransactionId($scope,
                window.localStorage.auth,
                window.localStorage.accountNo,
                $scope.id,
                document.getElementById("send_amount").value.replace(/ +?zpc$/i, ''),
                document.getElementById("send_memo").value)
        }
    } else {
        $scope.send = function () {
            //auth, userid, otheruseremail, amount, memo 
            zippcoin.createTransaction($scope,
                window.localStorage.auth,
                window.localStorage.accountNo,
                document.getElementById("send_email").value,
                document.getElementById("send_amount").value.replace(/ +?zpc$/i, ''),
                document.getElementById("send_memo").value)
        }
    }

}

App.controller("AppCtrl", ["$scope", "$log", "$rootScope", "$ionicHistory", "$ionicSideMenuDelegate", "zippcoin", AppCtrl]);

function AppCtrl($scope, $log, $rootScope, $ionicHistory, $ionicSideMenuDelegate, zippcoin) {

    $scope.send_result = -1;

    $rootScope.backSize = 0;

    $scope.toggleMenu = function () {
        $ionicSideMenuDelegate.toggleRight();
    };

    $scope.rsh = function () {
        //$rootScope.backSize = 1;
        //$ionicHistory.goBack(); //forces destruction of the controller (send page fix)
        $rootScope.backSize = 0;
    }

    $scope.refresh = function () {
        zippcoin.user($scope, window.localStorage.email);
    }

    $scope.login = function () {
        $scope.login_loading = true;
        var email = document.getElementById("email").value;
        zippcoin.setAuthHeader("Basic " + btoa(email + ":" + document.getElementById("pwd").value));
        zippcoin.user($scope, email);
        window.localStorage.email = email;
        document.getElementById("email").value = "";
        document.getElementById("pwd").value = "";
    }

    $scope.logout = function () {
        window.localStorage.removeItem("email");
        window.localStorage.removeItem("auth");
        document.getElementById("logindiv").setAttribute("style", null);
        $scope.userdata = null;
        window.localStorage.accountNo = null;
    }

    if (window.localStorage.auth && window.localStorage.email) {
        zippcoin.setAuthHeader(window.localStorage.auth);
        zippcoin.user($scope, window.localStorage.email);
    } else
        document.getElementById("logindiv").setAttribute("style", null);

}

function zippcoin($http, $log) {

    this.baseUrl = "http://wallet.zippcoin.com";

    this.findUser = function (userStr, $scope) {
        $scope.resultsRandom = null;
        $scope.search_loading = true;
        $http.get(this.baseUrl + "/api/user/lookup?userStr=" + userStr)
            .success(function (data) {
                $scope.error = null;
                $scope.results = data;
                $scope.search_loading = false;
                console.log(data);
            }).error(function (data) {
                $scope.search_loading = false;
                $scope.error = data.errorDescription;
                console.log(data);
            });
    }

    this.randomUsers = function ($scope) {
        $scope.results = null;
        $scope.search_loading = true;
        $http.get(this.baseUrl + "/api/user/random")
            .success(function (data) {
                $scope.error = null;
                $scope.search_loading = false;
                $scope.resultsRandom = data;
                console.log(data);
            })
            .error(function (data) {
                $scope.search_loading = false;
                $scope.error = data.errorDescription;
                console.log(data);
            });
    }

    this.transactionDetails = function ($scope, id) {
        $http.get(this.baseUrl + "/api/tx/" + id).success(function (data) {
                $scope.error = -1;
                console.log(data);
                $scope.txnDetails = data;
            })
            .error(function (data, errorcode) {
                $scope.error = errorcode;
            });
    }

    this.createTransaction = function ($scope, auth, userid, otheruseremail, amount, memo) {
        $scope.send_loading = true;
        $http({
            url: this.baseUrl + "/api/tx",
            method: "POST",
            data: '{"tx":{"fromAcctNo":"' + userid + '","toUser":{"email":"' + otheruseremail + '"},"amount":"' + amount + '","memo":"' + memo + '","sendToNewUser":""}}'
        }).success(function (data) {
            $scope.send_loading = false;
            $scope.send_result = 1;
            $scope.tx = data.tx;
            console.log(data);
        }).error(function (data) {
            $scope.send_loading = false;
            $scope.send_result = 0;
            $scope.error = data.errorDescription;
            console.log(data);
        })
    }

    this.createTransactionId = function ($scope, auth, userid, otheruserid, amount, memo) {
        $scope.send_loading = true;
        console.log('{"tx":{"fromAcctNo":"' + userid + '","toAcctNo":"' + otheruserid + '","amount":"' + amount + '","memo":"' + memo + '","sendToNewUser":""}}');
        $http({
            url: this.baseUrl + "/api/tx",
            method: "POST",
            data: '{"tx":{"fromAcctNo":"' + userid + '","toAcctNo":"' + otheruserid + '","amount": "' + amount + '","memo":"' + memo + '","sendToNewUser":""}}'
        }).success(function (data) {
            $scope.send_loading = false;
            $scope.send_result = 1;
            $scope.tx = data.tx;
            console.log(data);
        }).error(function (data) {
            $scope.send_loading = false;
            $scope.send_result = 0;
            $scope.error = data.errorDescription;
            console.log(data);
        })
    }

    this.setAuthHeader = function (auth) {
        window.localStorage['auth'] = auth;
        $http.defaults.headers.common.Authorization = auth;
    }

    this.user = function ($scope, email) {
        $scope.txns_loading = true;
        $http.get(this.baseUrl + "/api/user").success(function (data) {
            $http.get("http://wallet.zippcoin.com/api/user/lookup?userStr=" + email).success(function (data) {
                $scope.userdata = data;
                window.localStorage.accountNo = data.account.accountNo;
                console.log(data);
                $scope.txns_loading = false;
                $scope.login_loading = false;
            });
        });
    }
}

App.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('home', {
        url: '/home',
        templateUrl: 'home.html'
    })

    $stateProvider.state('search', {
        url: '/search',
        templateUrl: 'search.html'
    })

    $stateProvider.state('send', {
        url: '/send',
        templateUrl: 'send.html'
    })

    $stateProvider.state('send_specific', {
        url: '/send/:id/:name',
        templateUrl: 'send.html'
    })

    $stateProvider.state('txn', {
        url: '/txn/:id',
        templateUrl: 'txn.html'
    })

    $stateProvider.state('userdetails', {
        url: '/userdetails/:searchstr',
        templateUrl: 'userdetails.html'
    })

    $urlRouterProvider.otherwise("/home");
});

App.run(function ($ionicPlatform, $rootScope, $ionicNavBarDelegate, $cordovaPush, $ionicPopup, $ionicHistory, $http) {

    $rootScope.baseUrl = "https://wallet.zippcoin.com";

    $rootScope.back = function () {
        $ionicHistory.goBack();
        $rootScope.backSize--;
        console.log($rootScope.backSize);
    }

    $rootScope.forward = function () {
        $rootScope.backSize++;
        console.log($rootScope.backSize);
    }

    $rootScope.Math = Math;
    $rootScope.description = function (user) {
        if (!user)
            return null;
        if (user.facebookLocation)
            return user.facebookLocation;
        if (user.twitterLocation)
            return user.twitterLocation;
        if (user.twitterDescription)
            return user.twitterDescription;
        if (user.twitterScreenName)
            return user.twitterScreenName;
        return "";
    }
    $rootScope.unixToHuman = function (n, format) {
        var date = new Date(n);
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        if (format == "long")
            return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
        else if (format == "short")
            return months[date.getMonth()].substr(0, 3).toUpperCase() + " " + date.getDate();
    }
    $rootScope.test = function () {
        console.log("test");
    }

    document.addEventListener("resume", function (arguments) {
        console.log("resumed");
        $rootScope.paused = false;
    }, false);

    document.addEventListener("pause", function () {
        console.log("paused");
        $rootScope.paused = true;
    }, false);

    $ionicPlatform.registerBackButtonAction(function (event) {
        if ($rootScope.backSize > 0) {
            $rootScope.backSize--;
            navigator.app.backHistory();
        } else
            ionic.Platform.exitApp();
    }, 101);

    $ionicPlatform.ready(function () {

        //-------------- push notifications ---------

        var config = null;

        if (ionic.Platform.isAndroid()) {
            config = {
                "senderID": "553002996151",
            }
        } else if (ionic.Platform.isIOS()) { //TODO: implement ios notifications
            config = {
                "sound": "true",
                "alert": "true"
            }
        }

        showAlert = function (message, memo, txnid) {
            var templatehtml = message + (memo != null ? ": <br><font style='font-style: italic'>" + memo + "</font>" : "");
            $ionicPopup.show({
                title: 'You received zippcoin',
                template: templatehtml,
                buttons: [
                    {
                        text: 'Details',
                        type: 'button-positive',
                        onTap: function (e) {
                            $rootScope.forward();
                            window.location = "#/txn/" + txnid;
                        }
                        },
                    {
                        text: 'Close'
                    }
                ]
            });
        };

        $cordovaPush.register(config).then(function (result) { //this is only called when registering APN
            if (ionic.Platform.isIOS()) {
                regid = "apn-" + result;
                console.log(regid);
                window.localStorage.regid = regid;
                $http.get($rootScope.baseUrl + "/api/user/addRegistrationId?id=" + regid).success(function (data) {
                    console.log("registered id with zippcoin: " + regid);
                });

            }
            console.log("successfully registered push");
        }, function (err) {
            console.log("failed to register push");
        })

        $rootScope.$on('$cordovaPush:notificationReceived', function (event, notification) {
            if (!window.localStorage.auth) {
                $http.get($rootScope.baseUrl + "/api/user/removeRegistrationId?id=" + window.localStorage.regid).success(
                    function (data) {
                        console.log("unregistered id with zippcoin");
                    });
                $cordovaPush.unregister(null).then(function (result) {
                    console.log("unregistered push");
                }, function (err) {
                    console.log("failed to unregister push");
                });
            }
            switch (notification.event) {
            case 'registered':
                if (notification.regid.length > 0) {
                    window.localStorage.regid = notification.regid;
                    $http.get($rootScope.baseUrl + "/api/user/addRegistrationId?id=" + notification.regid).success(function (data) {
                        console.log("registered id with zippcoin: " + notification.regid);
                    });
                }
                break;

            case 'message':
                if (ionic.Platform.isAndroid())
                    showAlert(notification.payload.message, notification.payload.memo, notification.payload.txnid);
                else if (ionic.Platform.isIOS())
                    showAlert(notification.aps.alert.title, notification.aps.alert.body, notification.txnid);
                console.log(notification);
                break;

            case 'error':
                alert('push error = ' + notification.msg);
                break;

            default:
                alert('An unknown push event has occurred');
                break;
            }
        });

        //--------------------------------------------
        
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
})